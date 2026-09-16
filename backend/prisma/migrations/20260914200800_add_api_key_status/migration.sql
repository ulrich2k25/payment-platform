-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- AlterTable
ALTER TABLE "ApiKey" ADD COLUMN     "lastUsedAt" TIMESTAMP(3),
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE';
