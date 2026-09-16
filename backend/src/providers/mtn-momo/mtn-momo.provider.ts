import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { TransactionStatus } from '../../../generated/prisma/client';
import {
  CreateProviderPaymentInput,
  CreateProviderPaymentResult,
  GetProviderPaymentStatusInput,
  GetProviderPaymentStatusResult,
  PaymentProvider,
} from '../interfaces/payment-provider.interface';

interface MtnTokenResponse {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

interface MtnPaymentStatusResponse {
  status?: string;
}

@Injectable()
export class MtnMomoProvider implements PaymentProvider {
  private cachedAccessToken: string | null = null;
  private accessTokenExpiresAt = 0;

  async createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult> {
    if (!input.payerPhoneNumber) {
      throw new Error('payerPhoneNumber is required for MTN MoMo payments');
    }

    const targetEnvironment =
      process.env.MTN_MOMO_TARGET_ENVIRONMENT ?? 'sandbox';

    if (targetEnvironment === 'sandbox' && input.currency !== 'EUR') {
      throw new Error('MTN MoMo Sandbox only supports EUR test payments');
    }

    const accessToken = await this.getAccessToken();

    const providerReference = randomUUID();

    const baseUrl = this.getBaseUrl();
    const subscriptionKey = this.getRequiredConfig('MTN_MOMO_SUBSCRIPTION_KEY');

    const payerPhoneNumber = input.payerPhoneNumber.replace(/^\+/, '');

    const response = await fetch(`${baseUrl}/collection/v1_0/requesttopay`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'X-Target-Environment': targetEnvironment,
        'X-Reference-Id': providerReference,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amount.toString(),
        currency: input.currency,
        externalId: input.reference,
        payer: {
          partyIdType: 'MSISDN',
          partyId: payerPhoneNumber,
        },
        payerMessage: `Payment ${input.reference}`,
        payeeNote: `Payment ${input.reference}`,
      }),
      signal: AbortSignal.timeout(15_000),
    });

    if (response.status !== 202) {
      const responseBody = await response.text();

      throw new Error(
        `MTN MoMo RequestToPay failed with HTTP ${response.status}: ${responseBody}`,
      );
    }

    return {
      providerReference,
      status: 'PENDING',
    };
  }

  async getPaymentStatus(
    input: GetProviderPaymentStatusInput,
  ): Promise<GetProviderPaymentStatusResult> {
    const accessToken = await this.getAccessToken();

    const baseUrl = this.getBaseUrl();
    const subscriptionKey = this.getRequiredConfig('MTN_MOMO_SUBSCRIPTION_KEY');

    const targetEnvironment =
      process.env.MTN_MOMO_TARGET_ENVIRONMENT ?? 'sandbox';

    const response = await fetch(
      `${baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(
        input.providerReference,
      )}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'X-Target-Environment': targetEnvironment,
        },
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      const responseBody = await response.text();

      throw new Error(
        `MTN MoMo payment status request failed with HTTP ${response.status}: ${responseBody}`,
      );
    }

    const result = (await response.json()) as MtnPaymentStatusResponse;

    return {
      status: this.mapMtnStatus(result.status),
    };
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now();

    if (this.cachedAccessToken && now < this.accessTokenExpiresAt - 60_000) {
      return this.cachedAccessToken;
    }

    const apiUser = this.getRequiredConfig('MTN_MOMO_API_USER');
    const apiKey = this.getRequiredConfig('MTN_MOMO_API_KEY');
    const subscriptionKey = this.getRequiredConfig('MTN_MOMO_SUBSCRIPTION_KEY');

    const targetEnvironment =
      process.env.MTN_MOMO_TARGET_ENVIRONMENT ?? 'sandbox';

    const credentials = Buffer.from(`${apiUser}:${apiKey}`, 'utf8').toString(
      'base64',
    );

    const response = await fetch(`${this.getBaseUrl()}/collection/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'X-Target-Environment': targetEnvironment,
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      const responseBody = await response.text();

      throw new Error(
        `MTN MoMo token request failed with HTTP ${response.status}: ${responseBody}`,
      );
    }

    const token = (await response.json()) as MtnTokenResponse;

    if (!token.access_token) {
      throw new Error('MTN MoMo token response did not contain access_token');
    }

    const expiresIn =
      typeof token.expires_in === 'number' && token.expires_in > 0
        ? token.expires_in
        : 3600;

    this.cachedAccessToken = token.access_token;
    this.accessTokenExpiresAt = Date.now() + expiresIn * 1000;

    return token.access_token;
  }

  private mapMtnStatus(status?: string): TransactionStatus {
    switch (status?.toUpperCase()) {
      case 'SUCCESSFUL':
        return TransactionStatus.COMPLETED;

      case 'FAILED':
      case 'REJECTED':
        return TransactionStatus.FAILED;

      case 'PENDING':
        return TransactionStatus.PENDING;

      default:
        return TransactionStatus.REQUIRES_RECONCILIATION;
    }
  }

  private getBaseUrl(): string {
    return (
      process.env.MTN_MOMO_BASE_URL ?? 'https://sandbox.momodeveloper.mtn.com'
    ).replace(/\/+$/, '');
  }

  private getRequiredConfig(name: string): string {
    const value = process.env[name];

    if (!value?.trim()) {
      throw new Error(`${name} is not configured`);
    }

    return value.trim();
  }
}
