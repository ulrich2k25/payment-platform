import { createHmac } from 'crypto';
import { verifyWebhookSignature } from './verify-webhook-signature';

describe('verifyWebhookSignature', () => {
  it('accepts a valid webhook signature', () => {
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

    const signedPayload = `${timestamp}.${payload}`;

    const signature = createHmac('sha256', secret)
      .update(signedPayload)
      .digest('hex');

    const result = verifyWebhookSignature({
      webhookId,
      timestamp,
      signature: `sha256=${signature}`,
      rawBody: payload,
      secret,
    });

    expect(result).toEqual({
      valid: true,
      webhookId,
      timestamp: Number(timestamp),
    });
  });

  it('rejects an invalid webhook signature', () => {
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

    const invalidSignature =
      'sha256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';

    const result = verifyWebhookSignature({
      webhookId,
      timestamp,
      signature: invalidSignature,
      rawBody: payload,
      secret,
    });

    expect(result).toEqual({
      valid: false,
      reason: 'INVALID_SIGNATURE',
    });
  });
});

it('rejects a valid signature with an expired timestamp', () => {
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

  const timestamp = Math.floor(Date.now() / 1000 - 10 * 60).toString();

  const signedPayload = `${timestamp}.${payload}`;

  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const result = verifyWebhookSignature({
    webhookId,
    timestamp,
    signature: `sha256=${signature}`,
    rawBody: payload,
    secret,
  });

  expect(result).toEqual({
    valid: false,
    reason: 'TIMESTAMP_OUTSIDE_TOLERANCE',
  });
});

it('rejects a webhook when the raw body has been modified', () => {
  const webhookId = 'webhook_test_004';
  const secret = 'test_webhook_secret';

  const originalPayload = JSON.stringify({
    event: 'payment.completed',
    data: {
      id: 'payment_test_004',
      amount: 15000,
      currency: 'XAF',
      reference: 'TEST_004',
    },
  });

  const modifiedPayload = JSON.stringify({
    event: 'payment.completed',
    data: {
      id: 'payment_test_004',
      amount: 999999,
      currency: 'XAF',
      reference: 'TEST_004',
    },
  });

  const timestamp = Math.floor(Date.now() / 1000).toString();

  const signedPayload = `${timestamp}.${originalPayload}`;

  const signature = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const result = verifyWebhookSignature({
    webhookId,
    timestamp,
    signature: `sha256=${signature}`,
    rawBody: modifiedPayload,
    secret,
  });

  expect(result).toEqual({
    valid: false,
    reason: 'INVALID_SIGNATURE',
  });
});
it('rejects a malformed webhook signature', () => {
  const result = verifyWebhookSignature({
    webhookId: 'webhook_test_005',
    timestamp: Math.floor(Date.now() / 1000).toString(),
    signature: 'invalid_signature',
    rawBody: '{}',
    secret: 'test_webhook_secret',
  });

  expect(result).toEqual({
    valid: false,
    reason: 'INVALID_SIGNATURE_FORMAT',
  });
});
