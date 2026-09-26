import { ConflictException, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { MerchantSettingsService } from './merchant-settings.service';

describe('MerchantSettingsService', () => {
  let service: MerchantSettingsService;

  let prisma: {
    merchant: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };

  const merchant = {
    id: 'merchant-1',
    name: 'Old Company',
    email: 'old@example.com',
    status: 'ACTIVE',
    createdAt: new Date('2026-09-01T10:00:00.000Z'),
    updatedAt: new Date('2026-09-01T10:00:00.000Z'),
  };

  beforeEach(() => {
    prisma = {
      merchant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    service = new MerchantSettingsService(prisma as unknown as PrismaService);
  });

  it('updates the merchant profile', async () => {
    prisma.merchant.findUnique
      .mockResolvedValueOnce(merchant)
      .mockResolvedValueOnce(null);

    prisma.merchant.update.mockResolvedValue({
      ...merchant,
      name: 'New Company',
      email: 'contact@example.com',
    });

    const result = await service.updateProfile(merchant.id, {
      name: '  New Company  ',
      email: '  CONTACT@EXAMPLE.COM  ',
    });

    expect(prisma.merchant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: merchant.id,
        },
        data: {
          name: 'New Company',
          email: 'contact@example.com',
        },
      }),
    );

    expect(result).toEqual(
      expect.objectContaining({
        name: 'New Company',
        email: 'contact@example.com',
      }),
    );
  });

  it('rejects an email already used by another merchant', async () => {
    prisma.merchant.findUnique
      .mockResolvedValueOnce(merchant)
      .mockResolvedValueOnce({
        id: 'merchant-2',
      });

    await expect(
      service.updateProfile(merchant.id, {
        email: 'other@example.com',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.merchant.update).not.toHaveBeenCalled();
  });

  it('rejects an unknown merchant', async () => {
    prisma.merchant.findUnique.mockResolvedValue(null);

    await expect(
      service.updateProfile('missing-merchant', {
        name: 'Company',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(prisma.merchant.update).not.toHaveBeenCalled();
  });
});
