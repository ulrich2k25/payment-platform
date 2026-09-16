/*
  Warnings:

  - A unique constraint covering the columns `[merchantId,idempotencyKey]` on the table `Payment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "idempotencyKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Payment_merchantId_idempotencyKey_key" ON "Payment"("merchantId", "idempotencyKey");
