import {
  PaymentMethod,
  TransactionStatus,
} from '../../../generated/prisma/client';

export interface CreateProviderPaymentInput {
  paymentId: string;
  merchantId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference: string;
  payerPhoneNumber?: string;

  providerCredentials?: Record<string, string>;

  providerConfiguration?: Record<string, unknown>;
}

export interface CreateProviderPaymentResult {
  providerReference: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

  /**
   * URL vers laquelle le client doit être redirigé
   * lorsqu'un provider utilise un checkout hébergé.
   *
   * Exemple :
   * Fapshi Initiate Pay.
   */
  checkoutUrl?: string;
}

export interface GetProviderPaymentStatusInput {
  providerReference: string;

  providerCredentials?: Record<string, string>;
}

export interface GetProviderPaymentStatusResult {
  status: TransactionStatus;
}

export interface PaymentProvider {
  createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult>;

  getPaymentStatus(
    input: GetProviderPaymentStatusInput,
  ): Promise<GetProviderPaymentStatusResult>;
}
