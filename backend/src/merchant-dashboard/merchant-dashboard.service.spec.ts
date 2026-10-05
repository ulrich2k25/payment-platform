import { Test, TestingModule } from '@nestjs/testing';

import { PrismaService } from '../prisma/prisma.service';
import { MerchantDashboardService } from './merchant-dashboard.service';

describe('MerchantDashboardService', () => {
  let service: MerchantDashboardService;

  const prisma = {
    payment: {
      groupBy: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    webhookDelivery: {
      count: jest.fn(),
    },
    merchantProviderAccount: {
      count: jest.fn(),
    },
    apiKey: {
      count: jest.fn(),
    },
    merchant: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantDashboardService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<MerchantDashboardService>(MerchantDashboardService);
  });

  it('is defined', () => {
    expect(service).toBeDefined();
  });

  it('returns an aggregated summary for one merchant', async () => {
    prisma.payment.groupBy.mockResolvedValue([
      {
        status: 'COMPLETED',
        currency: 'XAF',
        _count: {
          _all: 3,
        },
        _sum: {
          amount: 15000,
        },
      },
      {
        status: 'FAILED',
        currency: 'XAF',
        _count: {
          _all: 1,
        },
        _sum: {
          amount: 5000,
        },
      },
      {
        status: 'PENDING',
        currency: 'EUR',
        _count: {
          _all: 2,
        },
        _sum: {
          amount: 2000,
        },
      },
    ]);

    prisma.payment.findMany.mockResolvedValue([
      {
        id: 'payment-1',
        amount: 5000,
        currency: 'XAF',
        method: 'MOBILE_MONEY',
        provider: 'FAPSHI',
        reference: 'ORDER-001',
        status: 'COMPLETED',
        createdAt: new Date('2026-10-05T10:00:00.000Z'),
      },
    ]);

    prisma.payment.count.mockResolvedValue(2);
    prisma.webhookDelivery.count.mockResolvedValue(1);
    prisma.merchantProviderAccount.count.mockResolvedValue(1);
    prisma.apiKey.count.mockResolvedValue(2);
    prisma.merchant.findUnique.mockResolvedValue({
      webhookUrl: 'https://merchant.example.com/webhooks/payment',
    });

    const result = await service.getSummary('merchant-1');

    expect(prisma.payment.groupBy).toHaveBeenCalledWith({
      by: ['status', 'currency'],
      where: {
        merchantId: 'merchant-1',
        createdAt: {
          gte: expect.any(Date),
        },
      },
      _count: {
        _all: true,
      },
      _sum: {
        amount: true,
      },
    });

    expect(prisma.payment.findMany).toHaveBeenCalledWith({
      where: {
        merchantId: 'merchant-1',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 5,
      select: {
        id: true,
        amount: true,
        currency: true,
        method: true,
        provider: true,
        reference: true,
        status: true,
        createdAt: true,
      },
    });

    expect(prisma.payment.count).toHaveBeenCalledWith({
      where: {
        merchantId: 'merchant-1',
        status: 'REQUIRES_RECONCILIATION',
      },
    });

    expect(prisma.webhookDelivery.count).toHaveBeenCalledWith({
      where: {
        merchantId: 'merchant-1',
        status: {
          in: ['FAILED', 'EXHAUSTED'],
        },
      },
    });

    expect(prisma.merchantProviderAccount.count).toHaveBeenCalledWith({
      where: {
        merchantId: 'merchant-1',
        status: 'ACTIVE',
      },
    });

    expect(prisma.apiKey.count).toHaveBeenCalledWith({
      where: {
        merchantId: 'merchant-1',
        status: 'ACTIVE',
      },
    });

    expect(prisma.merchant.findUnique).toHaveBeenCalledWith({
      where: {
        id: 'merchant-1',
      },
      select: {
        webhookUrl: true,
      },
    });

    expect(result.payments).toEqual({
      count: 6,
      completedCount: 3,
      finalizedCount: 4,
      successRate: 75,
      volumeByCurrency: [
        {
          currency: 'EUR',
          amount: 2000,
        },
        {
          currency: 'XAF',
          amount: 20000,
        },
      ],
    });

    expect(result.attention).toEqual({
      paymentsRequiringReconciliation: 2,
      webhookIssues: 1,
      total: 3,
    });

    expect(result.infrastructure).toEqual({
      activeProviderCount: 1,
      hasActiveProvider: true,
      activeApiKeyCount: 2,
      hasActiveApiKey: true,
      webhookConfigured: true,
    });

    expect(result.recentPayments).toHaveLength(1);
    expect(result.period.days).toBe(30);
    expect(result.period.from).toBeInstanceOf(Date);
    expect(result.period.to).toBeInstanceOf(Date);
  });

  it('keeps currencies separated when calculating payment volume', async () => {
    prisma.payment.groupBy.mockResolvedValue([
      {
        status: 'COMPLETED',
        currency: 'XAF',
        _count: {
          _all: 1,
        },
        _sum: {
          amount: 10000,
        },
      },
      {
        status: 'COMPLETED',
        currency: 'EUR',
        _count: {
          _all: 1,
        },
        _sum: {
          amount: 50,
        },
      },
      {
        status: 'FAILED',
        currency: 'XAF',
        _count: {
          _all: 1,
        },
        _sum: {
          amount: 5000,
        },
      },
    ]);

    prisma.payment.findMany.mockResolvedValue([]);
    prisma.payment.count.mockResolvedValue(0);
    prisma.webhookDelivery.count.mockResolvedValue(0);
    prisma.merchantProviderAccount.count.mockResolvedValue(0);
    prisma.apiKey.count.mockResolvedValue(0);
    prisma.merchant.findUnique.mockResolvedValue({
      webhookUrl: null,
    });

    const result = await service.getSummary('merchant-1');

    expect(result.payments.volumeByCurrency).toEqual([
      {
        currency: 'EUR',
        amount: 50,
      },
      {
        currency: 'XAF',
        amount: 15000,
      },
    ]);
  });

  it('returns no success rate when there are no finalized payments', async () => {
    prisma.payment.groupBy.mockResolvedValue([
      {
        status: 'PENDING',
        currency: 'XAF',
        _count: {
          _all: 2,
        },
        _sum: {
          amount: 10000,
        },
      },
      {
        status: 'PROCESSING',
        currency: 'XAF',
        _count: {
          _all: 1,
        },
        _sum: {
          amount: 5000,
        },
      },
    ]);

    prisma.payment.findMany.mockResolvedValue([]);
    prisma.payment.count.mockResolvedValue(0);
    prisma.webhookDelivery.count.mockResolvedValue(0);
    prisma.merchantProviderAccount.count.mockResolvedValue(0);
    prisma.apiKey.count.mockResolvedValue(0);
    prisma.merchant.findUnique.mockResolvedValue({
      webhookUrl: null,
    });

    const result = await service.getSummary('merchant-1');

    expect(result.payments.count).toBe(3);
    expect(result.payments.completedCount).toBe(0);
    expect(result.payments.finalizedCount).toBe(0);
    expect(result.payments.successRate).toBeNull();

    expect(result.attention.total).toBe(0);

    expect(result.infrastructure).toEqual({
      activeProviderCount: 0,
      hasActiveProvider: false,
      activeApiKeyCount: 0,
      hasActiveApiKey: false,
      webhookConfigured: false,
    });
  });
});
