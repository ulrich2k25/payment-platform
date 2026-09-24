import { Injectable } from '@nestjs/common';
import {
  PaymentMethod,
  TransactionStatus,
} from '../../../generated/prisma/client';
import {
  CreateProviderPaymentInput,
  CreateProviderPaymentResult,
  GetProviderPaymentStatusInput,
  GetProviderPaymentStatusResult,
  PaymentProvider,
} from '../interfaces/payment-provider.interface';

interface FapshiDirectPayResponse {
  message?: string;
  transId?: string;
  dateInitiated?: string;
}

interface FapshiPaymentStatusResponse {
  transId?: string;
  status?: string;
}

@Injectable()
export class FapshiProvider implements PaymentProvider {
  async createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult> {
    if (input.method !== PaymentMethod.MOBILE_MONEY) {
      throw new Error(
        'Fapshi can only be used with MOBILE_MONEY payments',
      );
    }

    if (input.currency.toUpperCase() !== 'XAF') {
      throw new Error(
        'Fapshi payments must use XAF',
      );
    }

    if (!Number.isInteger(input.amount) || input.amount < 100) {
      throw new Error(
        'Fapshi payments require an amount of at least 100 XAF',
      );
    }

    if (!input.payerPhoneNumber) {
      throw new Error(
        'payerPhoneNumber is required for Fapshi payments',
      );
    }

    const credentials = this.getCredentials(
      input.providerCredentials,
    );

    const phone = this.normalizeCameroonPhoneNumber(
      input.payerPhoneNumber,
    );

    const response = await fetch(
      `${this.getBaseUrl()}/direct-pay`,
      {
        method: 'POST',
        headers: {
          apiuser: credentials.apiuser,
          apikey: credentials.apikey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: input.amount,
          phone,
          userId: input.merchantId,
          externalId: input.paymentId,
          message: `Payment ${input.reference}`,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      const responseBody = await response.text();

      throw new Error(
        `Fapshi Direct Pay failed with HTTP ${response.status}: ${responseBody}`,
      );
    }

    const result =
      (await response.json()) as FapshiDirectPayResponse;

    if (!result.transId?.trim()) {
      throw new Error(
        'Fapshi Direct Pay response did not contain transId',
      );
    }

    return {
      providerReference: result.transId.trim(),
      status: 'PENDING',
    };
  }

  async getPaymentStatus(
    input: GetProviderPaymentStatusInput,
  ): Promise<GetProviderPaymentStatusResult> {
    const credentials = this.getCredentials(
      input.providerCredentials,
    );

    const response = await fetch(
      `${this.getBaseUrl()}/payment-status/${encodeURIComponent(
        input.providerReference,
      )}`,
      {
        method: 'GET',
        headers: {
          apiuser: credentials.apiuser,
          apikey: credentials.apikey,
        },
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!response.ok) {
      const responseBody = await response.text();

      throw new Error(
        `Fapshi payment status request failed with HTTP ${response.status}: ${responseBody}`,
      );
    }

    const rawResult = (await response.json()) as
      | FapshiPaymentStatusResponse
      | FapshiPaymentStatusResponse[];

    const result = Array.isArray(rawResult)
      ? rawResult[0]
      : rawResult;

    if (!result) {
      throw new Error(
        'Fapshi payment status response was empty',
      );
    }

    return {
      status: this.mapFapshiStatus(result.status),
    };
  }

  private getCredentials(
    credentials?: Record<string, string>,
  ): {
    apiuser: string;
    apikey: string;
  } {
    const apiuser = credentials?.apiuser?.trim();
    const apikey = credentials?.apikey?.trim();

    if (!apiuser) {
      throw new Error(
        'Fapshi apiuser credential is not configured',
      );
    }

    if (!apikey) {
      throw new Error(
        'Fapshi apikey credential is not configured',
      );
    }

    return {
      apiuser,
      apikey,
    };
  }

  private normalizeCameroonPhoneNumber(
    value: string,
  ): string {
    let phone = value.replace(/[^\d+]/g, '');

    if (phone.startsWith('+237')) {
      phone = phone.slice(4);
    } else if (
      phone.startsWith('237') &&
      phone.length === 12
    ) {
      phone = phone.slice(3);
    }

    phone = phone.replace(/\D/g, '');

    if (!/^6\d{8}$/.test(phone)) {
      throw new Error(
        'Fapshi requires a valid Cameroon mobile phone number',
      );
    }

    return phone;
  }

  private mapFapshiStatus(
    status?: string,
  ): TransactionStatus {
    switch (status?.toUpperCase()) {
      case 'SUCCESSFUL':
        return TransactionStatus.COMPLETED;

      case 'FAILED':
      case 'EXPIRED':
        return TransactionStatus.FAILED;

      case 'CREATED':
      case 'PENDING':
        return TransactionStatus.PENDING;

      default:
        return TransactionStatus.REQUIRES_RECONCILIATION;
    }
  }

  private getBaseUrl(): string {
    return (
      process.env.FAPSHI_BASE_URL ??
      'https://sandbox.fapshi.com'
    ).replace(/\/+$/, '');
  }
}