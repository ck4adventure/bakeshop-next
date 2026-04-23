-- Drop the existing trigger and function so we can replace them
DROP TRIGGER IF EXISTS trg_update_inventory ON "InventoryTransaction";
DROP FUNCTION IF EXISTS update_item_inventory();

-- Recreate to handle both INSERT (apply delta) and DELETE (reverse delta).
-- On INSERT, a non-negative guard raises a database-level exception if the
-- transaction would push stock below zero — catching concurrent writes that
-- slip past the service-layer pre-check.
CREATE OR REPLACE FUNCTION update_item_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_current_qty INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Ensure an ItemInventory row exists (initialises to 0 for new items)
    INSERT INTO "ItemInventory" ("itemId", "quantity", "updatedAt")
    VALUES (NEW."itemId", 0, now())
    ON CONFLICT ("itemId") DO NOTHING;

    -- Apply delta; the WHERE prevents negative stock atomically
    UPDATE "ItemInventory"
    SET "quantity"  = "quantity" + NEW."quantity",
        "updatedAt" = now()
    WHERE "itemId"             = NEW."itemId"
      AND "quantity" + NEW."quantity" >= 0;

    IF NOT FOUND THEN
      SELECT quantity INTO v_current_qty
      FROM "ItemInventory"
      WHERE "itemId" = NEW."itemId";
      RAISE EXCEPTION 'Stock cannot go negative (current: %, delta: %)',
        v_current_qty, NEW."quantity";
    END IF;

    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    -- Reverse the transaction's effect (used by undoBake)
    UPDATE "ItemInventory"
    SET "quantity"  = "quantity" - OLD."quantity",
        "updatedAt" = now()
    WHERE "itemId" = OLD."itemId";
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_inventory
AFTER INSERT OR DELETE ON "InventoryTransaction"
FOR EACH ROW
EXECUTE FUNCTION update_item_inventory();
