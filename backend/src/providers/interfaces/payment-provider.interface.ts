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
}

export interface CreateProviderPaymentResult {
  providerReference: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
}

export interface GetProviderPaymentStatusInput {
  providerReference: string;
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
