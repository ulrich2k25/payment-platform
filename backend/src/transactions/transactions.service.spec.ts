import { NotFoundException } from '@nestjs/common';

import {
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      transaction: {
        findFirst: jest.fn(),
      },
    };

    service = new TransactionsService(prisma as PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('returns a merchant transaction with its parent payment', async () => {
    const transaction = {
      id: 'transaction-1',
      paymentId: 'payment-1',
      provider: PaymentProvider.FAPSHI,
      providerAccountId: 'provider-account-1',
      providerReference: 'provider-ref-001',
      status: TransactionStatus.COMPLETED,
      amount: 2500,
      currency: 'XAF',
      createdAt: new Date('2026-09-26T10:00:00.000Z'),
      updatedAt: new Date('2026-09-26T10:05:00.000Z'),

      payment: {
        id: 'payment-1',
        merchantId: 'merchant-1',
        amount: 2500,
        currency: 'XAF',
        method: PaymentMethod.MOBILE_MONEY,
        provider: PaymentProvider.FAPSHI,
        reference: 'ORDER-001',
        providerReference: 'provider-ref-001',
        status: PaymentStatus.COMPLETED,
        createdAt: new Date('2026-09-26T10:00:00.000Z'),
        updatedAt: new Date('2026-09-26T10:05:00.000Z'),
      },
    };

    prisma.transaction.findFirst.mockResolvedValue(transaction);

    const result = await service.findOne('merchant-1', 'transaction-1');

    expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'transaction-1',
        payment: {
          merchantId: 'merchant-1',
        },
      },
      include: {
        payment: true,
      },
    });

    expect(result).toEqual(transaction);
  });

  it('does not return a transaction that belongs to another merchant', async () => {
    prisma.transaction.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('merchant-1', 'transaction-owned-by-merchant-2'),
    ).rejects.toThrow('Transaction not found');

    expect(prisma.transaction.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'transaction-owned-by-merchant-2',
        payment: {
          merchantId: 'merchant-1',
        },
      },
      include: {
        payment: true,
      },
    });
  });

  it('throws NotFoundException when the transaction does not exist', async () => {
    prisma.transaction.findFirst.mockResolvedValue(null);

    await expect(
      service.findOne('merchant-1', 'missing-transaction'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
