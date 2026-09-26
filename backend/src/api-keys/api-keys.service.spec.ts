import { ConflictException, NotFoundException } from '@nestjs/common';

import { ApiKeyStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;
  let prisma: any;

  const now = new Date();

  beforeEach(() => {
    prisma = {
      merchant: {
        findUnique: jest.fn(),
      },

      apiKey: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new ApiKeysService(prisma as PrismaService);
  });

  it('creates an API key for a merchant and stores only its hash', async () => {
    prisma.merchant.findUnique.mockResolvedValue({
      id: 'merchant-1',
    });

    prisma.apiKey.create.mockImplementation(async ({ data }: any) => ({
      id: 'key-1',
      ...data,
      status: ApiKeyStatus.ACTIVE,
      lastUsedAt: null,
      revokedAt: null,
      createdAt: now,
    }));

    const result = await service.createForMerchant('merchant-1');

    expect(result.key).toMatch(/^sk_test_[a-f0-9]{48}$/);

    const createCall = prisma.apiKey.create.mock.calls[0][0];

    expect(createCall.data.merchantId).toBe('merchant-1');

    expect(createCall.data.keyHash).not.toBe(result.key);

    expect(createCall.data.keyHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('rejects API key creation for an unknown merchant', async () => {
    prisma.merchant.findUnique.mockResolvedValue(null);

    await expect(
      service.createForMerchant('missing-merchant'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.apiKey.create).not.toHaveBeenCalled();
  });

  it('lists only API keys belonging to the merchant', async () => {
    prisma.merchant.findUnique.mockResolvedValue({
      id: 'merchant-1',
    });

    prisma.apiKey.findMany.mockResolvedValue([]);

    await service.findAllForMerchant('merchant-1');

    expect(prisma.apiKey.findMany).toHaveBeenCalledWith({
      where: {
        merchantId: 'merchant-1',
      },
      select: {
        id: true,
        merchantId: true,
        status: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  });

  it('revokes an API key belonging to the merchant', async () => {
    prisma.apiKey.findFirst.mockResolvedValue({
      id: 'key-1',
      merchantId: 'merchant-1',
      status: ApiKeyStatus.ACTIVE,
    });

    prisma.apiKey.update.mockResolvedValue({
      id: 'key-1',
      merchantId: 'merchant-1',
      status: ApiKeyStatus.REVOKED,
      lastUsedAt: null,
      revokedAt: now,
      createdAt: now,
    });

    const result = await service.revokeForMerchant('merchant-1', 'key-1');

    expect(prisma.apiKey.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'key-1',
        merchantId: 'merchant-1',
      },
    });

    expect(result.status).toBe(ApiKeyStatus.REVOKED);
  });

  it('does not allow a merchant to revoke another merchant API key', async () => {
    prisma.apiKey.findFirst.mockResolvedValue(null);

    await expect(
      service.revokeForMerchant('merchant-1', 'foreign-key'),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.apiKey.update).not.toHaveBeenCalled();
  });

  it('rejects revocation of an already revoked API key', async () => {
    prisma.apiKey.findFirst.mockResolvedValue({
      id: 'key-1',
      merchantId: 'merchant-1',
      status: ApiKeyStatus.REVOKED,
    });

    await expect(
      service.revokeForMerchant('merchant-1', 'key-1'),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.apiKey.update).not.toHaveBeenCalled();
  });
});
