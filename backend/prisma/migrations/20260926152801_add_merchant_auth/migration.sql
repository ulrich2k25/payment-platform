-- CreateEnum
CREATE TYPE "MerchantUserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "MerchantUserRole" AS ENUM ('OWNER', 'ADMIN', 'DEVELOPER', 'VIEWER');

-- CreateTable
CREATE TABLE "MerchantUser" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "MerchantUserRole" NOT NULL DEFAULT 'OWNER',
    "status" "MerchantUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MerchantSession" (
    "id" TEXT NOT NULL,
    "merchantUserId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MerchantUser_email_key" ON "MerchantUser"("email");

-- CreateIndex
CREATE INDEX "MerchantUser_merchantId_status_idx" ON "MerchantUser"("merchantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MerchantSession_tokenHash_key" ON "MerchantSession"("tokenHash");

-- CreateIndex
CREATE INDEX "MerchantSession_merchantUserId_expiresAt_idx" ON "MerchantSession"("merchantUserId", "expiresAt");

-- CreateIndex
CREATE INDEX "MerchantSession_expiresAt_revokedAt_idx" ON "MerchantSession"("expiresAt", "revokedAt");

-- AddForeignKey
ALTER TABLE "MerchantUser" ADD CONSTRAINT "MerchantUser_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MerchantSession" ADD CONSTRAINT "MerchantSession_merchantUserId_fkey" FOREIGN KEY ("merchantUserId") REFERENCES "MerchantUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
