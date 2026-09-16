export type AtomicWebhookProcessingResult =
  | {
      outcome: 'PROCESSED';
    }
  | {
      outcome: 'DUPLICATE';
    };

export type ProcessWebhookAtomically = (
  webhookId: string,
) => Promise<AtomicWebhookProcessingResult>;

export type WebhookDeduplicationResult =
  | {
      processed: true;
      duplicate: false;
      webhookId: string;
    }
  | {
      processed: false;
      duplicate: true;
      webhookId: string;
    };

export async function processWebhookWithDeduplication(
  webhookId: string,
  processWebhookAtomically: ProcessWebhookAtomically,
): Promise<WebhookDeduplicationResult> {
  const result = await processWebhookAtomically(webhookId);

  if (result.outcome === 'DUPLICATE') {
    return {
      processed: false,
      duplicate: true,
      webhookId,
    };
  }

  return {
    processed: true,
    duplicate: false,
    webhookId,
  };
}
