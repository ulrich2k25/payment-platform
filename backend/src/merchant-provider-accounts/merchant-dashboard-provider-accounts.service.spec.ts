jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { MerchantDashboardProviderAccountsService } from './merchant-dashboard-provider-accounts.service';
import { MerchantProviderAccountsService } from './merchant-provider-accounts.service';

describe('MerchantDashboardProviderAccountsService', () => {
  let service: MerchantDashboardProviderAccountsService;

  let prisma: {
    merchantProviderAccount: {
      findFirst: jest.Mock;
    };
  };

  let providerAccountsService: {
    findAllForMerchant: jest.Mock;
    update: jest.Mock;
    updateCredentials: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      merchantProviderAccount: {
        findFirst: jest.fn(),
      },
    };

    providerAccountsService = {
      findAllForMerchant: jest.fn(),
      update: jest.fn(),
      updateCredentials: jest.fn(),
    };

    service = new MerchantDashboardProviderAccountsService(
      prisma as unknown as PrismaService,
      providerAccountsService as unknown as MerchantProviderAccountsService,
    );
  });

  it('lists only provider accounts for the authenticated merchant', async () => {
    providerAccountsService.findAllForMerchant.mockResolvedValue([
      {
        id: 'account-1',
        merchantId: 'merchant-1',
        provider: 'FAPSHI',
      },
    ]);

    const result = await service.findAll('merchant-1');

    expect(providerAccountsService.findAllForMerchant).toHaveBeenCalledWith(
      'merchant-1',
    );

    expect(result).toHaveLength(1);
  });

  it('updates a provider account belonging to the merchant', async () => {
    prisma.merchantProviderAccount.findFirst.mockResolvedValue({
      id: 'account-1',
    });

    providerAccountsService.update.mockResolvedValue({
      id: 'account-1',
      status: 'ACTIVE',
    });

    const result = await service.update('merchant-1', 'account-1', {
      status: 'ACTIVE' as never,
    });

    expect(prisma.merchantProviderAccount.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'account-1',
        merchantId: 'merchant-1',
      },
      select: {
        id: true,
      },
    });

    expect(providerAccountsService.update).toHaveBeenCalledWith('account-1', {
      status: 'ACTIVE',
    });

    expect(result).toEqual({
      id: 'account-1',
      status: 'ACTIVE',
    });
  });

  it('rejects access to another merchant provider account', async () => {
    prisma.merchantProviderAccount.findFirst.mockResolvedValue(null);

    await expect(
      service.update('merchant-1', 'account-from-another-merchant', {
        priority: 10,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(providerAccountsService.update).not.toHaveBeenCalled();
  });

  it('updates credentials only for an owned provider account', async () => {
    prisma.merchantProviderAccount.findFirst.mockResolvedValue({
      id: 'account-1',
    });

    providerAccountsService.updateCredentials.mockResolvedValue({
      id: 'account-1',
      credentialsConfigured: true,
    });

    const result = await service.updateCredentials('merchant-1', 'account-1', {
      apiuser: 'test-user',
      apikey: 'test-key',
    });

    expect(providerAccountsService.updateCredentials).toHaveBeenCalledWith(
      'account-1',
      {
        apiuser: 'test-user',
        apikey: 'test-key',
      },
    );

    expect(result).toEqual({
      id: 'account-1',
      credentialsConfigured: true,
    });
  });
});
