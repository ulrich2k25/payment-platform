import { createHmac, timingSafeEqual } from 'crypto';

export type VerifyWebhookSignatureInput = {
  webhookId: string | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
  rawBody: string | Buffer;
  secret: string;
  toleranceSeconds?: number;
};

export type VerifyWebhookSignatureResult =
  | {
      valid: true;
      webhookId: string;
      timestamp: number;
    }
  | {
      valid: false;
      reason:
        | 'MISSING_WEBHOOK_ID'
        | 'MISSING_TIMESTAMP'
        | 'MISSING_SIGNATURE'
        | 'INVALID_TIMESTAMP'
        | 'TIMESTAMP_OUTSIDE_TOLERANCE'
        | 'INVALID_SIGNATURE_FORMAT'
        | 'INVALID_SIGNATURE';
    };

export function verifyWebhookSignature(
  input: VerifyWebhookSignatureInput,
): VerifyWebhookSignatureResult {
  const {
    webhookId,
    timestamp,
    signature,
    rawBody,
    secret,
    toleranceSeconds = 5 * 60,
  } = input;

  if (!webhookId) {
    return {
      valid: false,
      reason: 'MISSING_WEBHOOK_ID',
    };
  }

  if (!timestamp) {
    return {
      valid: false,
      reason: 'MISSING_TIMESTAMP',
    };
  }

  if (!signature) {
    return {
      valid: false,
      reason: 'MISSING_SIGNATURE',
    };
  }

  const parsedTimestamp = Number(timestamp);

  if (!Number.isInteger(parsedTimestamp) || parsedTimestamp <= 0) {
    return {
      valid: false,
      reason: 'INVALID_TIMESTAMP',
    };
  }

  const currentTimestamp = Math.floor(Date.now() / 1000);

  const timestampDifference = Math.abs(currentTimestamp - parsedTimestamp);

  if (timestampDifference > toleranceSeconds) {
    return {
      valid: false,
      reason: 'TIMESTAMP_OUTSIDE_TOLERANCE',
    };
  }

  const signaturePrefix = 'sha256=';

  if (!signature.startsWith(signaturePrefix)) {
    return {
      valid: false,
      reason: 'INVALID_SIGNATURE_FORMAT',
    };
  }

  const receivedSignatureHex = signature.slice(signaturePrefix.length);

  if (!/^[a-fA-F0-9]{64}$/.test(receivedSignatureHex)) {
    return {
      valid: false,
      reason: 'INVALID_SIGNATURE_FORMAT',
    };
  }

  const body = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

  const signedPayload = `${timestamp}.${body}`;

  const expectedSignatureHex = createHmac('sha256', secret)
    .update(signedPayload)
    .digest('hex');

  const receivedSignatureBuffer = Buffer.from(receivedSignatureHex, 'hex');

  const expectedSignatureBuffer = Buffer.from(expectedSignatureHex, 'hex');

  if (receivedSignatureBuffer.length !== expectedSignatureBuffer.length) {
    return {
      valid: false,
      reason: 'INVALID_SIGNATURE',
    };
  }

  const signatureMatches = timingSafeEqual(
    receivedSignatureBuffer,
    expectedSignatureBuffer,
  );

  if (!signatureMatches) {
    return {
      valid: false,
      reason: 'INVALID_SIGNATURE',
    };
  }

  return {
    valid: true,
    webhookId,
    timestamp: parsedTimestamp,
  };
}
