/*
  Warnings:

  - You are about to drop the column `quantity` on the `InventoryTransaction` table. All the data in the column will be lost.
  - Added the required column `delta` to the `InventoryTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "InventoryTransaction" DROP COLUMN "quantity",
ADD COLUMN     "delta" INTEGER NOT NULL;

-- Recreate trigger to reference the renamed column
DROP TRIGGER IF EXISTS trg_update_inventory ON "InventoryTransaction";
DROP FUNCTION IF EXISTS update_item_inventory();

CREATE OR REPLACE FUNCTION update_item_inventory()
RETURNS TRIGGER AS $$
DECLARE
  v_current_qty INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO "ItemInventory" ("itemId", "quantity", "updatedAt")
    VALUES (NEW."itemId", 0, now())
    ON CONFLICT ("itemId") DO NOTHING;

    UPDATE "ItemInventory"
    SET "quantity"  = "quantity" + NEW."delta",
        "updatedAt" = now()
    WHERE "itemId"             = NEW."itemId"
      AND "quantity" + NEW."delta" >= 0;

    IF NOT FOUND THEN
      SELECT quantity INTO v_current_qty
      FROM "ItemInventory"
      WHERE "itemId" = NEW."itemId";
      RAISE EXCEPTION 'Stock cannot go negative (current: %, delta: %)',
        v_current_qty, NEW."delta";
    END IF;

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
FOR EACH ROW
EXECUTE FUNCTION update_item_inventory();
