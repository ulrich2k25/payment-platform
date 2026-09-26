jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';

import { MerchantProviderAccountStatus } from '../../generated/prisma/client';
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
    getDecryptedCredentials: jest.Mock;
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
      getDecryptedCredentials: jest.fn(),
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

  it('updates safe routing fields for a provider account belonging to the merchant', async () => {
    prisma.merchantProviderAccount.findFirst.mockResolvedValue({
      id: 'account-1',
      provider: 'FAPSHI',
      credentialsEncrypted: 'encrypted-value',
    });

    providerAccountsService.update.mockResolvedValue({
      id: 'account-1',
      priority: 20,
    });

    const result = await service.update('merchant-1', 'account-1', {
      priority: 20,
    });

    expect(prisma.merchantProviderAccount.findFirst).toHaveBeenCalledWith({
      where: {
        id: 'account-1',
        merchantId: 'merchant-1',
      },
      select: {
        id: true,
        provider: true,
        credentialsEncrypted: true,
      },
    });

    expect(providerAccountsService.update).toHaveBeenCalledWith('account-1', {
      priority: 20,
    });

    expect(result).toEqual({
      id: 'account-1',
      priority: 20,
    });
  });

  it('activates FAPSHI when all required credentials are configured', async () => {
    prisma.merchantProviderAccount.findFirst.mockResolvedValue({
      id: 'account-1',
      provider: 'FAPSHI',
      credentialsEncrypted: 'encrypted-value',
    });

    providerAccountsService.getDecryptedCredentials.mockResolvedValue({
      apiuser: 'test-user',
      apikey: 'test-key',
      webhooksecret: 'test-webhook-secret',
    });

    providerAccountsService.update.mockResolvedValue({
      id: 'account-1',
      status: MerchantProviderAccountStatus.ACTIVE,
    });

    const result = await service.update('merchant-1', 'account-1', {
      status: MerchantProviderAccountStatus.ACTIVE,
    });

    expect(
      providerAccountsService.getDecryptedCredentials,
    ).toHaveBeenCalledWith('account-1');

    expect(providerAccountsService.update).toHaveBeenCalledWith('account-1', {
      status: MerchantProviderAccountStatus.ACTIVE,
    });

    expect(result).toEqual({
      id: 'account-1',
      status: MerchantProviderAccountStatus.ACTIVE,
    });
  });

  it('rejects FAPSHI activation when credentials are not configured', async () => {
    prisma.merchantProviderAccount.findFirst.mockResolvedValue({
      id: 'account-1',
      provider: 'FAPSHI',
      credentialsEncrypted: null,
    });

    await expect(
      service.update('merchant-1', 'account-1', {
        status: MerchantProviderAccountStatus.ACTIVE,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(
      providerAccountsService.getDecryptedCredentials,
    ).not.toHaveBeenCalled();

    expect(providerAccountsService.update).not.toHaveBeenCalled();
  });

  it('rejects FAPSHI as default when required credentials are incomplete', async () => {
    prisma.merchantProviderAccount.findFirst.mockResolvedValue({
      id: 'account-1',
      provider: 'FAPSHI',
      credentialsEncrypted: 'encrypted-value',
    });

    providerAccountsService.getDecryptedCredentials.mockResolvedValue({
      apiuser: 'test-user',
      apikey: 'test-key',
    });

    await expect(
      service.update('merchant-1', 'account-1', {
        isDefault: true,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(providerAccountsService.update).not.toHaveBeenCalled();
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

  it('stores credentials for an account without existing credentials', async () => {
    prisma.merchantProviderAccount.findFirst.mockResolvedValue({
      id: 'account-1',
      provider: 'FAPSHI',
      credentialsEncrypted: null,
    });

    providerAccountsService.updateCredentials.mockResolvedValue({
      id: 'account-1',
      credentialsConfigured: true,
    });

    await service.updateCredentials('merchant-1', 'account-1', {
      apiuser: 'test-user',
      apikey: 'test-key',
      webhooksecret: 'test-webhook-secret',
    });

    expect(
      providerAccountsService.getDecryptedCredentials,
    ).not.toHaveBeenCalled();

    expect(providerAccountsService.updateCredentials).toHaveBeenCalledWith(
      'account-1',
      {
        apiuser: 'test-user',
        apikey: 'test-key',
        webhooksecret: 'test-webhook-secret',
      },
    );
  });

  it('preserves existing credentials during a partial update', async () => {
    prisma.merchantProviderAccount.findFirst.mockResolvedValue({
      id: 'account-1',
      provider: 'FAPSHI',
      credentialsEncrypted: 'encrypted-value',
    });

    providerAccountsService.getDecryptedCredentials.mockResolvedValue({
      apiuser: 'existing-user',
      apikey: 'existing-key',
      webhooksecret: 'existing-webhook-secret',
    });

    providerAccountsService.updateCredentials.mockResolvedValue({
      id: 'account-1',
      credentialsConfigured: true,
    });

    await service.updateCredentials('merchant-1', 'account-1', {
      apikey: 'new-key',
    });

    expect(
      providerAccountsService.getDecryptedCredentials,
    ).toHaveBeenCalledWith('account-1');

    expect(providerAccountsService.updateCredentials).toHaveBeenCalledWith(
      'account-1',
      {
        apiuser: 'existing-user',
        apikey: 'new-key',
        webhooksecret: 'existing-webhook-secret',
      },
    );
  });
});
