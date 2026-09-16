import { processWebhookWithDeduplication } from './webhook-deduplication';

describe('processWebhookWithDeduplication', () => {
  it('processes a webhook once and identifies a later duplicate', async () => {
    const processedWebhookIds = new Set<string>();

    const processWebhookAtomically = async (webhookId: string) => {
      if (processedWebhookIds.has(webhookId)) {
        return {
          outcome: 'DUPLICATE' as const,
        };
      }

      processedWebhookIds.add(webhookId);

      return {
        outcome: 'PROCESSED' as const,
      };
    };

    const webhookId = 'webhook_test_001';

    const firstResult = await processWebhookWithDeduplication(
      webhookId,
      processWebhookAtomically,
    );

    expect(firstResult).toEqual({
      processed: true,
      duplicate: false,
      webhookId,
    });

    const secondResult = await processWebhookWithDeduplication(
      webhookId,
      processWebhookAtomically,
    );

    expect(secondResult).toEqual({
      processed: false,
      duplicate: true,
      webhookId,
    });
  });

  it('allows a later retry when the atomic business processing fails', async () => {
    const processedWebhookIds = new Set<string>();
    let shouldFail = true;

    const processWebhookAtomically = async (webhookId: string) => {
      if (processedWebhookIds.has(webhookId)) {
        return {
          outcome: 'DUPLICATE' as const,
        };
      }

      if (shouldFail) {
        throw new Error('Simulated business processing failure');
      }

      processedWebhookIds.add(webhookId);

      return {
        outcome: 'PROCESSED' as const,
      };
    };

    const webhookId = 'webhook_test_002';

    await expect(
      processWebhookWithDeduplication(webhookId, processWebhookAtomically),
    ).rejects.toThrow('Simulated business processing failure');

    expect(processedWebhookIds.has(webhookId)).toBe(false);

    shouldFail = false;

    const retryResult = await processWebhookWithDeduplication(
      webhookId,
      processWebhookAtomically,
    );

    expect(retryResult).toEqual({
      processed: true,
      duplicate: false,
      webhookId,
    });

    expect(processedWebhookIds.has(webhookId)).toBe(true);
  });
});
