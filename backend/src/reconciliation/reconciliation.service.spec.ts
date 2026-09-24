jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import {
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
} from '../../generated/prisma/client';
import { MerchantProviderAccountsService } from '../merchant-provider-accounts/merchant-provider-accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ReconciliationService } from './reconciliation.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  let prisma: any;
  let providersService: any;
  let webhooksService: any;
  let merchantProviderAccountsService: any;

  let provider: {
    createPayment: jest.Mock;
    getPaymentStatus: jest.Mock;
  };

  beforeEach(() => {
    provider = {
      createPayment: jest.fn(),
      getPaymentStatus: jest.fn(),
    };

    prisma = {
      payment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },

      transaction: {
        update: jest.fn(),
      },

      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation(
      async (callback: any) => {
        return callback(prisma);
      },
    );

    providersService = {
      getProvider: jest
        .fn()
        .mockReturnValue(provider),
    };

    webhooksService = {
      sendPaymentCompleted: jest.fn(),
    };

    merchantProviderAccountsService = {
      getDecryptedCredentials:
        jest.fn(),
    };

    service = new ReconciliationService(
      prisma as PrismaService,
      providersService as ProvidersService,
      webhooksService as WebhooksService,
      merchantProviderAccountsService as MerchantProviderAccountsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('reconciles a FAPSHI payment using credentials from its provider account', async () => {
    const payment = {
      id: 'payment-1',
      merchantId: 'merchant-1',
      provider:
        PaymentProvider.FAPSHI,
      amount: 1000,
      currency: 'XAF',
      reference: 'ORDER-001',
      status:
        PaymentStatus.REQUIRES_RECONCILIATION,

      merchant: {
        id: 'merchant-1',
        webhookUrl:
          'https://merchant.example/webhook',
      },

      transactions: [
        {
          id: 'transaction-1',
          provider:
            PaymentProvider.FAPSHI,
          providerAccountId:
            'fapshi-account-1',
          providerReference:
            'fapshi-trans-123',
          status:
            TransactionStatus.REQUIRES_RECONCILIATION,
          createdAt: new Date(),
        },
      ],
    };

    prisma.payment.findFirst.mockResolvedValue(
      payment,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        apiuser: 'sandbox-user',
        apikey: 'sandbox-secret',
      },
    );

    provider.getPaymentStatus.mockResolvedValue({
      status:
        TransactionStatus.COMPLETED,
    });

    prisma.transaction.update.mockResolvedValue({
      ...payment.transactions[0],
      status:
        TransactionStatus.COMPLETED,
    });

    prisma.payment.update.mockResolvedValue({
      ...payment,
      status: PaymentStatus.COMPLETED,
    });

    const result =
      await service.reconcilePayment(
        'merchant-1',
        'payment-1',
      );

    expect(
      merchantProviderAccountsService
        .getDecryptedCredentials,
    ).toHaveBeenCalledWith(
      'fapshi-account-1',
    );

    expect(
      provider.getPaymentStatus,
    ).toHaveBeenCalledWith({
      providerReference:
        'fapshi-trans-123',
      providerCredentials: {
        apiuser: 'sandbox-user',
        apikey: 'sandbox-secret',
      },
    });

    expect(result.status).toBe(
      PaymentStatus.COMPLETED,
    );

    expect(
      webhooksService.sendPaymentCompleted,
    ).toHaveBeenCalledTimes(1);
  });

  it('polls a normal PENDING FAPSHI payment and completes it', async () => {
    const payment = {
      id: 'payment-2',
      merchantId: 'merchant-1',
      provider:
        PaymentProvider.FAPSHI,
      amount: 100,
      currency: 'XAF',
      reference: 'ORDER-002',
      status: PaymentStatus.PENDING,

      merchant: {
        id: 'merchant-1',
        webhookUrl: null,
      },

      transactions: [
        {
          id: 'transaction-2',
          provider:
            PaymentProvider.FAPSHI,
          providerAccountId:
            'fapshi-account-1',
          providerReference:
            'fapshi-trans-456',
          status:
            TransactionStatus.PENDING,
          createdAt: new Date(),
        },
      ],
    };

    prisma.payment.findFirst.mockResolvedValue(
      payment,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        apiuser: 'sandbox-user',
        apikey: 'sandbox-secret',
      },
    );

    provider.getPaymentStatus.mockResolvedValue({
      status:
        TransactionStatus.COMPLETED,
    });

    prisma.transaction.update.mockResolvedValue(
      {},
    );

    prisma.payment.update.mockResolvedValue({
      ...payment,
      status: PaymentStatus.COMPLETED,
    });

    const result =
      await service.reconcilePayment(
        'merchant-1',
        'payment-2',
      );

    expect(
      provider.getPaymentStatus,
    ).toHaveBeenCalledTimes(1);

    expect(
      prisma.transaction.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'transaction-2',
      },
      data: {
        status:
          TransactionStatus.COMPLETED,
      },
    });

    expect(
      prisma.payment.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'payment-2',
      },
      data: {
        status:
          PaymentStatus.COMPLETED,
      },
    });

    expect(result.status).toBe(
      PaymentStatus.COMPLETED,
    );
  });

  it('keeps a normal FAPSHI payment PENDING while Fapshi is still pending', async () => {
    const payment = {
      id: 'payment-3',
      merchantId: 'merchant-1',
      provider:
        PaymentProvider.FAPSHI,
      amount: 100,
      currency: 'XAF',
      reference: 'ORDER-003',
      status: PaymentStatus.PENDING,

      merchant: {
        id: 'merchant-1',
        webhookUrl: null,
      },

      transactions: [
        {
          id: 'transaction-3',
          provider:
            PaymentProvider.FAPSHI,
          providerAccountId:
            'fapshi-account-1',
          providerReference:
            'fapshi-pending',
          status:
            TransactionStatus.PENDING,
          createdAt: new Date(),
        },
      ],
    };

    prisma.payment.findFirst.mockResolvedValue(
      payment,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        apiuser: 'sandbox-user',
        apikey: 'sandbox-secret',
      },
    );

    provider.getPaymentStatus.mockResolvedValue({
      status:
        TransactionStatus.PENDING,
    });

    prisma.transaction.update.mockResolvedValue(
      {},
    );

    prisma.payment.update.mockResolvedValue({
      ...payment,
      status: PaymentStatus.PENDING,
    });

    const result =
      await service.reconcilePayment(
        'merchant-1',
        'payment-3',
      );

    expect(
      prisma.payment.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'payment-3',
      },
      data: {
        status:
          PaymentStatus.PENDING,
      },
    });

    expect(result.status).toBe(
      PaymentStatus.PENDING,
    );
  });

  it('keeps REQUIRES_RECONCILIATION when the provider is still pending', async () => {
    const payment = {
      id: 'payment-4',
      merchantId: 'merchant-1',
      provider:
        PaymentProvider.SANDBOX,
      amount: 1000,
      currency: 'XAF',
      reference: 'ORDER-004',
      status:
        PaymentStatus.REQUIRES_RECONCILIATION,

      merchant: {
        id: 'merchant-1',
        webhookUrl: null,
      },

      transactions: [
        {
          id: 'transaction-4',
          provider:
            PaymentProvider.SANDBOX,
          providerAccountId: null,
          providerReference:
            'sandbox-pending',
          status:
            TransactionStatus.REQUIRES_RECONCILIATION,
          createdAt: new Date(),
        },
      ],
    };

    prisma.payment.findFirst.mockResolvedValue(
      payment,
    );

    provider.getPaymentStatus.mockResolvedValue({
      status:
        TransactionStatus.PENDING,
    });

    prisma.transaction.update.mockResolvedValue(
      {},
    );

    prisma.payment.update.mockResolvedValue({
      ...payment,
      status:
        PaymentStatus.REQUIRES_RECONCILIATION,
    });

    const result =
      await service.reconcilePayment(
        'merchant-1',
        'payment-4',
      );

    expect(
      merchantProviderAccountsService
        .getDecryptedCredentials,
    ).not.toHaveBeenCalled();

    expect(
      prisma.payment.update,
    ).toHaveBeenCalledWith({
      where: {
        id: 'payment-4',
      },
      data: {
        status:
          PaymentStatus.REQUIRES_RECONCILIATION,
      },
    });

    expect(result.status).toBe(
      PaymentStatus.REQUIRES_RECONCILIATION,
    );
  });

  it('does not call Fapshi when the transaction has no providerAccountId', async () => {
    const payment = {
      id: 'payment-5',
      merchantId: 'merchant-1',
      provider:
        PaymentProvider.FAPSHI,
      amount: 1000,
      currency: 'XAF',
      reference: 'ORDER-005',
      status: PaymentStatus.PENDING,

      merchant: {
        id: 'merchant-1',
        webhookUrl: null,
      },

      transactions: [
        {
          id: 'transaction-5',
          provider:
            PaymentProvider.FAPSHI,
          providerAccountId: null,
          providerReference:
            'fapshi-trans-789',
          status:
            TransactionStatus.PENDING,
          createdAt: new Date(),
        },
      ],
    };

    prisma.payment.findFirst.mockResolvedValue(
      payment,
    );

    const result =
      await service.reconcilePayment(
        'merchant-1',
        'payment-5',
      );

    expect(
      merchantProviderAccountsService
        .getDecryptedCredentials,
    ).not.toHaveBeenCalled();

    expect(
      provider.getPaymentStatus,
    ).not.toHaveBeenCalled();

    expect(result).toBe(payment);
  });

  it('selects REQUIRES_RECONCILIATION payments and pending FAPSHI payments for automatic reconciliation', async () => {
    prisma.payment.findMany.mockResolvedValue(
      [],
    );

    const result =
      await service.reconcilePendingPayments();

    expect(
      prisma.payment.findMany,
    ).toHaveBeenCalledWith({
      where: {
        OR: [
          {
            status:
              PaymentStatus.REQUIRES_RECONCILIATION,
          },
          {
            provider:
              PaymentProvider.FAPSHI,
            status: {
              in: [
                PaymentStatus.PENDING,
                PaymentStatus.PROCESSING,
              ],
            },
          },
        ],
      },
      select: {
        id: true,
        merchantId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    expect(result).toEqual({
      processed: 0,
      succeeded: 0,
      failed: 0,
      results: [],
    });
  });
});