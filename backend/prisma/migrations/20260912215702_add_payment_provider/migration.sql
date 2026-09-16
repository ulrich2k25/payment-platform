-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('SANDBOX', 'MTN_MOMO', 'ORANGE_MONEY', 'STELLAR');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "provider" "PaymentProvider" NOT NULL DEFAULT 'SANDBOX';
