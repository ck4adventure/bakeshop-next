-- Add point-in-time stock snapshot to each transaction
ALTER TABLE "InventoryTransaction" ADD COLUMN "stockAfter" INTEGER NOT NULL DEFAULT 0;

-- Drop existing trigger and function
DROP TRIGGER IF EXISTS trg_update_inventory ON "InventoryTransaction";
DROP FUNCTION IF EXISTS update_item_inventory();

-- BEFORE INSERT: validate non-negative and capture stockAfter
CREATE OR REPLACE FUNCTION capture_stock_after()
RETURNS TRIGGER AS $$
DECLARE
  v_current_qty INTEGER;
BEGIN
  SELECT COALESCE(quantity, 0) INTO v_current_qty
  FROM "ItemInventory"
  WHERE "itemId" = NEW."itemId";

  IF v_current_qty + NEW."delta" < 0 THEN
    RAISE EXCEPTION 'Stock cannot go negative (current: %, delta: %)',
      v_current_qty, NEW."delta";
  END IF;

  NEW."stockAfter" := v_current_qty + NEW."delta";
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_capture_stock_after
BEFORE INSERT ON "InventoryTransaction"
FOR EACH ROW EXECUTE FUNCTION capture_stock_after();

-- AFTER INSERT OR DELETE: keep ItemInventory in sync
CREATE OR REPLACE FUNCTION update_item_inventory()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "ItemInventory" ("itemId", "quantity", "updatedAt")
    VALUES (NEW."itemId", NEW."stockAfter", now())
    ON CONFLICT ("itemId") DO UPDATE
      SET "quantity"  = NEW."stockAfter",
          "updatedAt" = now();
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "ItemInventory"
    SET "quantity"  = "quantity" - OLD."delta",
        "updatedAt" = now()
    WHERE "itemId" = OLD."itemId";
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_inventory
AFTER INSERT OR DELETE ON "InventoryTransaction"
FOR EACH ROW EXECUTE FUNCTION update_item_inventory();
