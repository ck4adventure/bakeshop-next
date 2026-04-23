-- CreateTable
CREATE TABLE "DailyQuotaOverride" (
    "id" SERIAL NOT NULL,
    "itemId" INTEGER NOT NULL,
    "bakeryId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "quantity" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyQuotaOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyQuotaOverride_itemId_date_key" ON "DailyQuotaOverride"("itemId", "date");

-- AddForeignKey
ALTER TABLE "DailyQuotaOverride" ADD CONSTRAINT "DailyQuotaOverride_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyQuotaOverride" ADD CONSTRAINT "DailyQuotaOverride_bakeryId_fkey" FOREIGN KEY ("bakeryId") REFERENCES "Bakery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
