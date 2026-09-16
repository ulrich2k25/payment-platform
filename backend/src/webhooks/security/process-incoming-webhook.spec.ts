import { createHmac } from 'crypto';
import { processIncomingWebhook } from './process-incoming-webhook';

describe('processIncomingWebhook', () => {
  it('accepts and processes a valid new webhook', async () => {
    const webhookId = 'webhook_test_001';
    const secret = 'test_webhook_secret';

    const payload = JSON.stringify({
      event: 'payment.completed',
      data: {
        id: 'payment_test_001',
        amount: 15000,
        currency: 'XAF',
        reference: 'TEST_001',
      },
    });

    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const processedWebhookIds = new Set<string>();

    const processWebhookAtomically = async (id: string) => {
      if (processedWebhookIds.has(id)) {
        return {
          outcome: 'DUPLICATE' as const,
        };
      }

      processedWebhookIds.add(id);

      return {
        outcome: 'PROCESSED' as const,
      };
    };

    const result = await processIncomingWebhook({
      webhookId,
      timestamp,
      signature: `sha256=${signature}`,
      rawBody: payload,
      secret,
      processWebhookAtomically,
    });

    expect(result).toEqual({
      accepted: true,
      outcome: 'PROCESSED',
      webhookId,
    });

    expect(processedWebhookIds.has(webhookId)).toBe(true);
  });

  it('accepts a valid duplicate webhook without processing it again', async () => {
    const webhookId = 'webhook_test_002';
    const secret = 'test_webhook_secret';

    const payload = JSON.stringify({
      event: 'payment.completed',
      data: {
        id: 'payment_test_002',
        amount: 25000,
        currency: 'XAF',
        reference: 'TEST_002',
      },
    });

    const timestamp = Math.floor(Date.now() / 1000).toString();

    const signature = createHmac('sha256', secret)
      .update(`${timestamp}.${payload}`)
      .digest('hex');

    const processedWebhookIds = new Set<string>([webhookId]);

    let businessProcessingCount = 0;

    const processWebhookAtomically = async (id: string) => {
      if (processedWebhookIds.has(id)) {
        return {
          outcome: 'DUPLICATE' as const,
        };
      }

      businessProcessingCount += 1;
      processedWebhookIds.add(id);

      return {
        outcome: 'PROCESSED' as const,
      };
    };

    const result = await processIncomingWebhook({
      webhookId,
      timestamp,
      signature: `sha256=${signature}`,
      rawBody: payload,
      secret,
      processWebhookAtomically,
    });

    expect(result).toEqual({
      accepted: true,
      outcome: 'DUPLICATE',
      webhookId,
    });

    expect(businessProcessingCount).toBe(0);
  });
});

it('rejects an invalid signature without calling business processing', async () => {
  const webhookId = 'webhook_test_003';
  const secret = 'test_webhook_secret';

  const payload = JSON.stringify({
    event: 'payment.completed',
    data: {
      id: 'payment_test_003',
      amount: 30000,
      currency: 'XAF',
      reference: 'TEST_003',
    },
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();

  let businessProcessingCalled = false;

  const processWebhookAtomically = async () => {
    businessProcessingCalled = true;

    return {
      outcome: 'PROCESSED' as const,
    };
  };

  const result = await processIncomingWebhook({
    webhookId,
    timestamp,
    signature:
      'sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    rawBody: payload,
    secret,
    processWebhookAtomically,
  });

  expect(result).toEqual({
    accepted: false,
    reason: 'INVALID_SIGNATURE',
  });

  expect(businessProcessingCalled).toBe(false);
});
it('rejects an expired webhook without calling business processing', async () => {
  const webhookId = 'webhook_test_004';
  const secret = 'test_webhook_secret';

  const payload = JSON.stringify({
    event: 'payment.completed',
    data: {
      id: 'payment_test_004',
      amount: 40000,
      currency: 'XAF',
      reference: 'TEST_004',
    },
  });

  const timestamp = Math.floor(Date.now() / 1000 - 10 * 60).toString();

  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  let businessProcessingCalled = false;

  const processWebhookAtomically = async () => {
    businessProcessingCalled = true;

    return {
      outcome: 'PROCESSED' as const,
    };
  };

  const result = await processIncomingWebhook({
    webhookId,
    timestamp,
    signature: `sha256=${signature}`,
    rawBody: payload,
    secret,
    processWebhookAtomically,
  });

  expect(result).toEqual({
    accepted: false,
    reason: 'TIMESTAMP_OUTSIDE_TOLERANCE',
  });

  expect(businessProcessingCalled).toBe(false);
});
