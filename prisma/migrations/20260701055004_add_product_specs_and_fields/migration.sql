-- AlterTable
ALTER TABLE "product" ADD COLUMN     "brand" TEXT,
ADD COLUMN     "comparePrice" DECIMAL(12,2),
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "sku" TEXT,
ADD COLUMN     "warranty" TEXT;

-- CreateTable
CREATE TABLE "product_spec" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "group" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "productId" TEXT NOT NULL,

    CONSTRAINT "product_spec_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_spec_productId_idx" ON "product_spec"("productId");

-- CreateIndex
CREATE INDEX "product_sku_idx" ON "product"("sku");

-- AddForeignKey
ALTER TABLE "product_spec" ADD CONSTRAINT "product_spec_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
