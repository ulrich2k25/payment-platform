import {
  VerifyWebhookSignatureResult,
  verifyWebhookSignature,
} from './verify-webhook-signature';

import {
  ProcessWebhookAtomically,
  processWebhookWithDeduplication,
} from './webhook-deduplication';

export type ProcessIncomingWebhookInput = {
  webhookId: string | undefined;
  timestamp: string | undefined;
  signature: string | undefined;
  rawBody: string | Buffer;
  secret: string;
  toleranceSeconds?: number;
  processWebhookAtomically: ProcessWebhookAtomically;
};

export type ProcessIncomingWebhookResult =
  | {
      accepted: true;
      outcome: 'PROCESSED';
      webhookId: string;
    }
  | {
      accepted: true;
      outcome: 'DUPLICATE';
      webhookId: string;
    }
  | {
      accepted: false;
      reason: Extract<VerifyWebhookSignatureResult, { valid: false }>['reason'];
    };

export async function processIncomingWebhook(
  input: ProcessIncomingWebhookInput,
): Promise<ProcessIncomingWebhookResult> {
  const verification = verifyWebhookSignature({
    webhookId: input.webhookId,
    timestamp: input.timestamp,
    signature: input.signature,
    rawBody: input.rawBody,
    secret: input.secret,
    toleranceSeconds: input.toleranceSeconds,
  });

  if (!verification.valid) {
    return {
      accepted: false,
      reason: verification.reason,
    };
  }

  const deduplication = await processWebhookWithDeduplication(
    verification.webhookId,
    input.processWebhookAtomically,
  );

  if (deduplication.duplicate) {
    return {
      accepted: true,
      outcome: 'DUPLICATE',
      webhookId: verification.webhookId,
    };
  }

  return {
    accepted: true,
    outcome: 'PROCESSED',
    webhookId: verification.webhookId,
  };
}
