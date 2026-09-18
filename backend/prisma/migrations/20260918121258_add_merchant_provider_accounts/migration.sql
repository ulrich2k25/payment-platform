-- CreateEnum
CREATE TYPE "MerchantProviderAccountStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "MerchantProviderAccount" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "MerchantProviderAccountStatus" NOT NULL DEFAULT 'INACTIVE',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "credentialsEncrypted" TEXT,
    "externalAccountId" TEXT,
    "configuration" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantProviderAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MerchantProviderAccount_merchantId_status_idx" ON "MerchantProviderAccount"("merchantId", "status");

-- CreateIndex
CREATE INDEX "MerchantProviderAccount_provider_status_idx" ON "MerchantProviderAccount"("provider", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantProviderAccount_merchantId_provider_key" ON "MerchantProviderAccount"("merchantId", "provider");

-- AddForeignKey
ALTER TABLE "MerchantProviderAccount" ADD CONSTRAINT "MerchantProviderAccount_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
