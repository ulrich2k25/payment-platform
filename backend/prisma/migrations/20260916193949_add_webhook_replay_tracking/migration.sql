-- AlterTable
ALTER TABLE "WebhookDelivery" ADD COLUMN     "lastReplayedAt" TIMESTAMP(3),
ADD COLUMN     "replayCount" INTEGER NOT NULL DEFAULT 0;
