-- CreateTable
CREATE TABLE "PerStoreInventory" (
    "storeId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("storeId", "sku")
);

-- CreateTable
CREATE TABLE "SeenEvent" (
    "eventId" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "idx_inventory_sku" ON "PerStoreInventory"("sku");
