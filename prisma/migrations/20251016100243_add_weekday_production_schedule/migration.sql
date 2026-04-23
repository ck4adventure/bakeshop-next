/*
  Warnings:

  - The primary key for the `ProductionSchedule` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - Changed the type of `weekday` on the `ProductionSchedule` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "Weekday" AS ENUM ('Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');

-- DropForeignKey
ALTER TABLE "ProductionSchedule" DROP CONSTRAINT "ProductionSchedule_itemId_fkey";

-- AlterTable
ALTER TABLE "ProductionSchedule" DROP CONSTRAINT "ProductionSchedule_pkey",
DROP COLUMN "weekday",
ADD COLUMN     "weekday" "Weekday" NOT NULL,
ALTER COLUMN "quantity" SET DEFAULT 0,
ADD CONSTRAINT "ProductionSchedule_pkey" PRIMARY KEY ("itemId", "weekday");

-- AddForeignKey
ALTER TABLE "ProductionSchedule" ADD CONSTRAINT "ProductionSchedule_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;
