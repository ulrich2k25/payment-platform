jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { UnauthorizedException } from '@nestjs/common';
import {
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
} from '../../generated/prisma/client';
import { MerchantProviderAccountsService } from '../merchant-provider-accounts/merchant-provider-accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ProviderCallbacksService } from './provider-callbacks.service';

describe('ProviderCallbacksService', () => {
  let service: ProviderCallbacksService;

  let prisma: any;
  let webhooksService: any;
  let merchantProviderAccountsService: any;

  const webhookSecret = 'fapshi-webhook-secret-test';

  const buildTransaction = (
    paymentStatus: PaymentStatus = PaymentStatus.PENDING,
  ) => ({
    id: 'transaction-1',
    paymentId: 'payment-1',
    provider: PaymentProvider.FAPSHI,
    providerAccountId: 'fapshi-account-1',
    providerReference: 'fapshi-trans-123',
    status: TransactionStatus.PENDING,
    amount: 100,
    currency: 'XAF',

    payment: {
      id: 'payment-1',
      merchantId: 'merchant-1',
      amount: 100,
      currency: 'XAF',
      reference: 'ORDER-001',
      status: paymentStatus,

      merchant: {
        id: 'merchant-1',
        webhookUrl: 'https://merchant.example/webhook',
      },
    },
  });

  beforeEach(() => {
    prisma = {
      transaction: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },

      payment: {
        updateMany: jest.fn(),
        findUnique: jest.fn(),
      },

      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation(
      async (callback: any) => callback(prisma),
    );

    webhooksService = {
      sendPaymentCompleted: jest.fn(),
    };

    merchantProviderAccountsService = {
      getDecryptedCredentials: jest.fn(),
    };

    service = new ProviderCallbacksService(
      prisma as PrismaService,
      webhooksService as WebhooksService,
      merchantProviderAccountsService as MerchantProviderAccountsService,
    );
  });

  it('processes a SUCCESSFUL Fapshi webhook as COMPLETED', async () => {
    const transaction = buildTransaction();

    prisma.transaction.findFirst.mockResolvedValue(
      transaction,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        apiuser: 'sandbox-user',
        apikey: 'sandbox-key',
        webhooksecret: webhookSecret,
      },
    );

    prisma.payment.updateMany.mockResolvedValue({
      count: 1,
    });

    prisma.transaction.update.mockResolvedValue({
      ...transaction,
      status: TransactionStatus.COMPLETED,
    });

    const result =
      await service.handleFapshiCallback(
        webhookSecret,
        {
          transId: 'fapshi-trans-123',
          status: 'SUCCESSFUL',
          externalId: 'payment-1',
          userId: 'merchant-1',
        },
      );

    expect(
      prisma.transaction.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        provider: PaymentProvider.FAPSHI,
        providerReference: 'fapshi-trans-123',
      },
      include: {
        payment: {
          include: {
            merchant: true,
          },
        },
      },
    });

    expect(
      merchantProviderAccountsService
        .getDecryptedCredentials,
    ).toHaveBeenCalledWith(
      'fapshi-account-1',
    );

    expect(
      prisma.payment.updateMany,
    ).toHaveBeenCalledWith({
      where: {
        id: 'payment-1',
        status: {
          in: [
            PaymentStatus.PENDING,
            PaymentStatus.PROCESSING,
            PaymentStatus.REQUIRES_RECONCILIATION,
          ],
        },
      },
      data: {
        status: PaymentStatus.COMPLETED,
      },
    });

    expect(
      prisma.transaction.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'transaction-1',
      },
      data: {
        status: TransactionStatus.COMPLETED,
      },
    });

    expect(
      webhooksService.sendPaymentCompleted,
    ).toHaveBeenCalledTimes(1);

    expect(result).toEqual({
      received: true,
      processed: true,
      duplicate: false,
      paymentId: 'payment-1',
      status: PaymentStatus.COMPLETED,
    });
  });

  it('processes a FAILED Fapshi webhook as FAILED', async () => {
    const transaction = buildTransaction();

    prisma.transaction.findFirst.mockResolvedValue(
      transaction,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        apiuser: 'sandbox-user',
        apikey: 'sandbox-key',
        webhooksecret: webhookSecret,
      },
    );

    prisma.payment.updateMany.mockResolvedValue({
      count: 1,
    });

    prisma.transaction.update.mockResolvedValue(
      {},
    );

    const result =
      await service.handleFapshiCallback(
        webhookSecret,
        {
          transId: 'fapshi-trans-123',
          status: 'FAILED',
          externalId: 'payment-1',
        },
      );

    expect(
      prisma.payment.updateMany,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: PaymentStatus.FAILED,
        },
      }),
    );

    expect(
      prisma.transaction.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'transaction-1',
      },
      data: {
        status: TransactionStatus.FAILED,
      },
    });

    expect(
      webhooksService.sendPaymentCompleted,
    ).not.toHaveBeenCalled();

    expect(result.status).toBe(
      PaymentStatus.FAILED,
    );
  });

  it('processes an EXPIRED Fapshi webhook as FAILED', async () => {
    const transaction = buildTransaction();

    prisma.transaction.findFirst.mockResolvedValue(
      transaction,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        webhooksecret: webhookSecret,
      },
    );

    prisma.payment.updateMany.mockResolvedValue({
      count: 1,
    });

    prisma.transaction.update.mockResolvedValue(
      {},
    );

    const result =
      await service.handleFapshiCallback(
        webhookSecret,
        {
          transId: 'fapshi-trans-123',
          status: 'EXPIRED',
          externalId: 'payment-1',
        },
      );

    expect(result.status).toBe(
      PaymentStatus.FAILED,
    );

    expect(
      webhooksService.sendPaymentCompleted,
    ).not.toHaveBeenCalled();
  });

  it('rejects a Fapshi webhook with an invalid secret', async () => {
    const transaction = buildTransaction();

    prisma.transaction.findFirst.mockResolvedValue(
      transaction,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        webhooksecret: webhookSecret,
      },
    );

    await expect(
      service.handleFapshiCallback(
        'wrong-secret',
        {
          transId: 'fapshi-trans-123',
          status: 'SUCCESSFUL',
          externalId: 'payment-1',
        },
      ),
    ).rejects.toThrow(
      UnauthorizedException,
    );

    expect(
      prisma.payment.updateMany,
    ).not.toHaveBeenCalled();

    expect(
      prisma.transaction.update,
    ).not.toHaveBeenCalled();

    expect(
      webhooksService.sendPaymentCompleted,
    ).not.toHaveBeenCalled();
  });

  it('rejects a Fapshi webhook when externalId does not match the local payment', async () => {
    const transaction = buildTransaction();

    prisma.transaction.findFirst.mockResolvedValue(
      transaction,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        webhooksecret: webhookSecret,
      },
    );

    await expect(
      service.handleFapshiCallback(
        webhookSecret,
        {
          transId: 'fapshi-trans-123',
          status: 'SUCCESSFUL',
          externalId: 'another-payment-id',
        },
      ),
    ).rejects.toThrow(
      UnauthorizedException,
    );

    expect(
      prisma.payment.updateMany,
    ).not.toHaveBeenCalled();

    expect(
      webhooksService.sendPaymentCompleted,
    ).not.toHaveBeenCalled();
  });

  it('treats an already completed payment as a duplicate', async () => {
    const transaction = buildTransaction(
      PaymentStatus.COMPLETED,
    );

    prisma.transaction.findFirst.mockResolvedValue(
      transaction,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        webhooksecret: webhookSecret,
      },
    );

    const result =
      await service.handleFapshiCallback(
        webhookSecret,
        {
          transId: 'fapshi-trans-123',
          status: 'SUCCESSFUL',
          externalId: 'payment-1',
        },
      );

    expect(result).toEqual({
      received: true,
      processed: false,
      duplicate: true,
      paymentId: 'payment-1',
      status: PaymentStatus.COMPLETED,
    });

    expect(
      prisma.payment.updateMany,
    ).not.toHaveBeenCalled();

    expect(
      prisma.transaction.update,
    ).not.toHaveBeenCalled();

    expect(
      webhooksService.sendPaymentCompleted,
    ).not.toHaveBeenCalled();
  });

  it('handles a concurrent callback as a duplicate after the atomic claim fails', async () => {
    const transaction = buildTransaction();

    prisma.transaction.findFirst.mockResolvedValue(
      transaction,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        webhooksecret: webhookSecret,
      },
    );

    prisma.payment.updateMany.mockResolvedValue({
      count: 0,
    });

    prisma.payment.findUnique.mockResolvedValue({
      id: 'payment-1',
      status: PaymentStatus.COMPLETED,
    });

    const result =
      await service.handleFapshiCallback(
        webhookSecret,
        {
          transId: 'fapshi-trans-123',
          status: 'SUCCESSFUL',
          externalId: 'payment-1',
        },
      );

    expect(result).toEqual({
      received: true,
      processed: false,
      duplicate: true,
      paymentId: 'payment-1',
      status: PaymentStatus.COMPLETED,
    });

    expect(
      prisma.transaction.update,
    ).not.toHaveBeenCalled();

    expect(
      webhooksService.sendPaymentCompleted,
    ).not.toHaveBeenCalled();
  });
});