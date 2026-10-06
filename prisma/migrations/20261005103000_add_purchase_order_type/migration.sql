-- CreateEnum
CREATE TYPE "PurchaseOrderType" AS ENUM ('MAIL', 'AGREEMENT', 'NORMAL');

-- AlterTable
ALTER TABLE "PurchaseOrder" ADD COLUMN "purchaseOrderType" "PurchaseOrderType";
