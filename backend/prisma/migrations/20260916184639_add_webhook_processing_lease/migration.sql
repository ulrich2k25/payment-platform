-- AlterTable
ALTER TABLE "WebhookDelivery" ADD COLUMN     "processingStartedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "WebhookDelivery_status_processingStartedAt_idx" ON "WebhookDelivery"("status", "processingStartedAt");
