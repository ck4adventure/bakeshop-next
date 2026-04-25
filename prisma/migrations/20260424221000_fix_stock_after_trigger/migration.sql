-- Fix: initialise v_current_qty to 0 so a missing ItemInventory row
-- (first-ever transaction for an item) doesn't produce NULL + delta = NULL.
DROP TRIGGER IF EXISTS trg_capture_stock_after ON "InventoryTransaction";
DROP FUNCTION IF EXISTS capture_stock_after();

CREATE OR REPLACE FUNCTION capture_stock_after()
RETURNS TRIGGER AS $$
DECLARE
  v_current_qty INTEGER := 0;
BEGIN
  SELECT quantity INTO v_current_qty
  FROM "ItemInventory"
  WHERE "itemId" = NEW."itemId";

  -- COALESCE covers the case where a row exists but quantity is somehow NULL
  v_current_qty := COALESCE(v_current_qty, 0);

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
