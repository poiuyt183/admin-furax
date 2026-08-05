-- CreateEnum
CREATE TYPE "WarrantyStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "warranty_activation" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "customerAddress" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productSku" TEXT,
    "productName" TEXT NOT NULL,
    "status" "WarrantyStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewedById" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warranty_activation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "warranty_activation_customerPhone_idx" ON "warranty_activation"("customerPhone");

-- CreateIndex
CREATE INDEX "warranty_activation_status_idx" ON "warranty_activation"("status");

-- CreateIndex
CREATE INDEX "warranty_activation_productId_idx" ON "warranty_activation"("productId");

-- AddForeignKey
ALTER TABLE "warranty_activation" ADD CONSTRAINT "warranty_activation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
