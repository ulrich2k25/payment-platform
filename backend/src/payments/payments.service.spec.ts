jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import {
  MerchantProviderAccountStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
} from '../../generated/prisma/client';
import { MerchantProviderAccountsService } from '../merchant-provider-accounts/merchant-provider-accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  let prisma: any;
  let webhooksService: any;
  let providersService: any;
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
      merchant: {
        findUnique: jest.fn(),
      },

      merchantProviderAccount: {
        findFirst: jest.fn(),
      },

      payment: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },

      transaction: {
        create: jest.fn(),
        update: jest.fn(),
      },

      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation(
      async (input: any) => {
        if (typeof input === 'function') {
          return input(prisma);
        }

        return Promise.all(input);
      },
    );

    webhooksService = {
      sendPaymentCompleted: jest.fn(),
    };

    providersService = {
      getProvider: jest.fn().mockReturnValue(provider),
    };

    merchantProviderAccountsService = {
      findActiveAccount: jest.fn(),
      getDecryptedCredentials: jest.fn(),
    };

    service = new PaymentsService(
      prisma as PrismaService,
      webhooksService as WebhooksService,
      providersService as ProvidersService,
      merchantProviderAccountsService as MerchantProviderAccountsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('falls back to SANDBOX when the merchant has no active provider account', async () => {
    prisma.merchant.findUnique.mockResolvedValue({
      id: 'merchant-1',
      name: 'Test Merchant',
    });

    prisma.merchantProviderAccount.findFirst.mockResolvedValue(
      null,
    );

    const createdPayment = {
      id: 'payment-1',
      merchantId: 'merchant-1',
      amount: 500,
      currency: 'XAF',
      method: PaymentMethod.MOBILE_MONEY,
      provider: PaymentProvider.SANDBOX,
      reference: 'ORDER-001',
      status: PaymentStatus.PENDING,
    };

    const createdTransaction = {
      id: 'transaction-1',
      paymentId: 'payment-1',
      provider: PaymentProvider.SANDBOX,
      providerAccountId: null,
      amount: 500,
      currency: 'XAF',
      status: TransactionStatus.PENDING,
    };

    prisma.payment.create.mockResolvedValue(
      createdPayment,
    );

    prisma.transaction.create.mockResolvedValue(
      createdTransaction,
    );

    provider.createPayment.mockResolvedValue({
      providerReference: 'sandbox-payment-1',
      status: 'PENDING',
    });

    prisma.transaction.update.mockResolvedValue({
      ...createdTransaction,
      providerReference: 'sandbox-payment-1',
    });

    prisma.payment.update.mockResolvedValue({
      ...createdPayment,
      providerReference: 'sandbox-payment-1',
    });

    const result = await service.create(
      'merchant-1',
      500,
      'XAF',
      PaymentMethod.MOBILE_MONEY,
      'ORDER-001',
      undefined,
      '670000000',
    );

    expect(
      prisma.merchantProviderAccount.findFirst,
    ).toHaveBeenCalledWith({
      where: {
        merchantId: 'merchant-1',
        status:
          MerchantProviderAccountStatus.ACTIVE,
      },
      orderBy: [
        {
          isDefault: 'desc',
        },
        {
          priority: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
    });

    expect(
      providersService.getProvider,
    ).toHaveBeenCalledWith(
      PaymentProvider.SANDBOX,
    );

    expect(
      prisma.transaction.create,
    ).toHaveBeenCalledWith({
      data: {
        paymentId: 'payment-1',
        provider: PaymentProvider.SANDBOX,
        providerAccountId: undefined,
        amount: 500,
        currency: 'XAF',
      },
    });

    expect(
      merchantProviderAccountsService.getDecryptedCredentials,
    ).not.toHaveBeenCalled();

    expect(result.provider).toBe(
      PaymentProvider.SANDBOX,
    );
  });

  it('uses the active FAPSHI provider account and passes decrypted credentials only to the provider', async () => {
    prisma.merchant.findUnique.mockResolvedValue({
      id: 'merchant-1',
      name: 'Ubiza',
    });

    const providerAccount = {
      id: 'fapshi-account-1',
      merchantId: 'merchant-1',
      provider: 'FAPSHI',
      status:
        MerchantProviderAccountStatus.ACTIVE,
      isDefault: true,
      priority: 10,
    };

    merchantProviderAccountsService.findActiveAccount.mockResolvedValue(
      providerAccount,
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        apiuser: 'sandbox-user',
        apikey: 'sandbox-secret',
      },
    );

    const createdPayment = {
      id: 'payment-2',
      merchantId: 'merchant-1',
      amount: 1000,
      currency: 'XAF',
      method: PaymentMethod.MOBILE_MONEY,
      provider: PaymentProvider.FAPSHI,
      reference: 'ORDER-002',
      status: PaymentStatus.PENDING,
    };

    const createdTransaction = {
      id: 'transaction-2',
      paymentId: 'payment-2',
      provider: PaymentProvider.FAPSHI,
      providerAccountId:
        'fapshi-account-1',
      amount: 1000,
      currency: 'XAF',
      status: TransactionStatus.PENDING,
    };

    prisma.payment.create.mockResolvedValue(
      createdPayment,
    );

    prisma.transaction.create.mockResolvedValue(
      createdTransaction,
    );

    provider.createPayment.mockResolvedValue({
      providerReference: 'fapshi-trans-123',
      status: 'PENDING',
    });

    prisma.transaction.update.mockResolvedValue({
      ...createdTransaction,
      providerReference: 'fapshi-trans-123',
    });

    prisma.payment.update.mockResolvedValue({
      ...createdPayment,
      providerReference: 'fapshi-trans-123',
    });

    const result = await service.create(
      'merchant-1',
      1000,
      'XAF',
      PaymentMethod.MOBILE_MONEY,
      'ORDER-002',
      undefined,
      '670000000',
      PaymentProvider.FAPSHI,
    );

    expect(
      merchantProviderAccountsService.findActiveAccount,
    ).toHaveBeenCalledWith(
      'merchant-1',
      PaymentProvider.FAPSHI,
    );

    expect(
      merchantProviderAccountsService.getDecryptedCredentials,
    ).toHaveBeenCalledWith(
      'fapshi-account-1',
    );

    expect(
      providersService.getProvider,
    ).toHaveBeenCalledWith(
      PaymentProvider.FAPSHI,
    );

    expect(
      prisma.transaction.create,
    ).toHaveBeenCalledWith({
      data: {
        paymentId: 'payment-2',
        provider: PaymentProvider.FAPSHI,
        providerAccountId:
          'fapshi-account-1',
        amount: 1000,
        currency: 'XAF',
      },
    });

    expect(
      provider.createPayment,
    ).toHaveBeenCalledWith({
      paymentId: 'payment-2',
      merchantId: 'merchant-1',
      amount: 1000,
      currency: 'XAF',
      method: PaymentMethod.MOBILE_MONEY,
      reference: 'ORDER-002',
      payerPhoneNumber: '670000000',

      providerCredentials: {
        apiuser: 'sandbox-user',
        apikey: 'sandbox-secret',
      },
    });

    expect(result.provider).toBe(
      PaymentProvider.FAPSHI,
    );
  });

  it('automatically selects the active default FAPSHI account when no provider is explicitly requested', async () => {
    prisma.merchant.findUnique.mockResolvedValue({
      id: 'merchant-1',
      name: 'Ubiza',
    });

    prisma.merchantProviderAccount.findFirst.mockResolvedValue(
      {
        id: 'fapshi-account-1',
        merchantId: 'merchant-1',
        provider: 'FAPSHI',
        status:
          MerchantProviderAccountStatus.ACTIVE,
        isDefault: true,
        priority: 10,
      },
    );

    merchantProviderAccountsService.getDecryptedCredentials.mockResolvedValue(
      {
        apiuser: 'sandbox-user',
        apikey: 'sandbox-secret',
      },
    );

    const createdPayment = {
      id: 'payment-3',
      merchantId: 'merchant-1',
      amount: 1500,
      currency: 'XAF',
      method: PaymentMethod.MOBILE_MONEY,
      provider: PaymentProvider.FAPSHI,
      reference: 'ORDER-003',
      status: PaymentStatus.PENDING,
    };

    const createdTransaction = {
      id: 'transaction-3',
      paymentId: 'payment-3',
      provider: PaymentProvider.FAPSHI,
      providerAccountId:
        'fapshi-account-1',
      amount: 1500,
      currency: 'XAF',
      status: TransactionStatus.PENDING,
    };

    prisma.payment.create.mockResolvedValue(
      createdPayment,
    );

    prisma.transaction.create.mockResolvedValue(
      createdTransaction,
    );

    provider.createPayment.mockResolvedValue({
      providerReference: 'fapshi-trans-456',
      status: 'PENDING',
    });

    prisma.transaction.update.mockResolvedValue({
      ...createdTransaction,
      providerReference: 'fapshi-trans-456',
    });

    prisma.payment.update.mockResolvedValue({
      ...createdPayment,
      providerReference: 'fapshi-trans-456',
    });

    const result = await service.create(
      'merchant-1',
      1500,
      'XAF',
      PaymentMethod.MOBILE_MONEY,
      'ORDER-003',
      undefined,
      '670000000',
    );

    expect(
      prisma.merchantProviderAccount.findFirst,
    ).toHaveBeenCalled();

    expect(
      merchantProviderAccountsService.getDecryptedCredentials,
    ).toHaveBeenCalledWith(
      'fapshi-account-1',
    );

    expect(
      merchantProviderAccountsService.findActiveAccount,
    ).not.toHaveBeenCalled();

    expect(
      providersService.getProvider,
    ).toHaveBeenCalledWith(
      PaymentProvider.FAPSHI,
    );

    expect(
      prisma.transaction.create,
    ).toHaveBeenCalledWith({
      data: {
        paymentId: 'payment-3',
        provider: PaymentProvider.FAPSHI,
        providerAccountId:
          'fapshi-account-1',
        amount: 1500,
        currency: 'XAF',
      },
    });

    expect(result.provider).toBe(
      PaymentProvider.FAPSHI,
    );
  });
});