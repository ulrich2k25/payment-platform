-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'FAPSHI';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "providerAccountId" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_providerAccountId_idx" ON "Transaction"("providerAccountId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_providerAccountId_fkey" FOREIGN KEY ("providerAccountId") REFERENCES "MerchantProviderAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
