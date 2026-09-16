import { Injectable } from '@nestjs/common';
import { TransactionStatus } from '../../../generated/prisma/client';
import {
  CreateProviderPaymentInput,
  CreateProviderPaymentResult,
  GetProviderPaymentStatusInput,
  GetProviderPaymentStatusResult,
  PaymentProvider,
} from '../interfaces/payment-provider.interface';

@Injectable()
export class SandboxProvider implements PaymentProvider {
  async createPayment(
    input: CreateProviderPaymentInput,
  ): Promise<CreateProviderPaymentResult> {
    if (input.reference.startsWith('SANDBOX_FAIL_TEST')) {
      throw new Error('Simulated sandbox provider failure');
    }

    return {
      providerReference: `sandbox_${input.paymentId}`,
      status: 'PENDING',
    };
  }

  async getPaymentStatus(
    input: GetProviderPaymentStatusInput,
  ): Promise<GetProviderPaymentStatusResult> {
    if (input.providerReference.includes('sandbox_reconcile_completed')) {
      return {
        status: TransactionStatus.COMPLETED,
      };
    }

    if (input.providerReference.includes('sandbox_reconcile_failed')) {
      return {
        status: TransactionStatus.FAILED,
      };
    }

    return {
      status: TransactionStatus.PENDING,
    };
  }
}
