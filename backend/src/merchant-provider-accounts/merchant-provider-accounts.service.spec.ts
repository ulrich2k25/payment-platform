jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MerchantProviderAccountStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderCredentialsCryptoService } from '../security/provider-credentials-crypto.service';
import { MerchantProviderAccountsService } from './merchant-provider-accounts.service';

describe('MerchantProviderAccountsService', () => {
  let service: MerchantProviderAccountsService;

  let prisma: {
    merchantProviderAccount: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  let credentialsCrypto: {
    decrypt: jest.Mock;
  };

  beforeEach(() => {
    prisma = {
      merchantProviderAccount: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    credentialsCrypto = {
      decrypt: jest.fn(),
    };

    service = new MerchantProviderAccountsService(
      prisma as unknown as PrismaService,
      credentialsCrypto as unknown as ProviderCredentialsCryptoService,
    );
  });

  describe('findActiveAccount', () => {
    it('returns the active provider account for the merchant', async () => {
      const account = {
        id: 'provider-account-1',
        merchantId: 'merchant-1',
        provider: 'FAPSHI',
        status: MerchantProviderAccountStatus.ACTIVE,
      };

      prisma.merchantProviderAccount.findFirst.mockResolvedValue(account);

      const result = await service.findActiveAccount('merchant-1', ' fapshi ');

      expect(prisma.merchantProviderAccount.findFirst).toHaveBeenCalledWith({
        where: {
          merchantId: 'merchant-1',
          provider: 'FAPSHI',
          status: MerchantProviderAccountStatus.ACTIVE,
        },
      });

      expect(result).toEqual(account);
    });

    it('throws when no active provider account exists', async () => {
      prisma.merchantProviderAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.findActiveAccount('merchant-1', 'FAPSHI'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getDecryptedCredentials', () => {
    it('decrypts credentials using the provider account context', async () => {
      const account = {
        id: 'provider-account-1',
        merchantId: 'merchant-1',
        provider: 'FAPSHI',
        credentialsEncrypted: 'encrypted-value',
      };

      const decryptedCredentials = {
        apiuser: 'test-user',
        apikey: 'test-secret',
      };

      prisma.merchantProviderAccount.findUnique.mockResolvedValue(account);

      credentialsCrypto.decrypt.mockReturnValue(decryptedCredentials);

      const result =
        await service.getDecryptedCredentials('provider-account-1');

      expect(prisma.merchantProviderAccount.findUnique).toHaveBeenCalledWith({
        where: {
          id: 'provider-account-1',
        },
      });

      expect(credentialsCrypto.decrypt).toHaveBeenCalledWith(
        'encrypted-value',
        'merchant-provider-account:provider-account-1:merchant-1:FAPSHI',
      );

      expect(result).toEqual(decryptedCredentials);
    });

    it('throws when credentials are not configured', async () => {
      prisma.merchantProviderAccount.findUnique.mockResolvedValue({
        id: 'provider-account-1',
        merchantId: 'merchant-1',
        provider: 'FAPSHI',
        credentialsEncrypted: null,
      });

      await expect(
        service.getDecryptedCredentials('provider-account-1'),
      ).rejects.toThrow(BadRequestException);

      expect(credentialsCrypto.decrypt).not.toHaveBeenCalled();
    });

    it('throws when the provider account does not exist', async () => {
      prisma.merchantProviderAccount.findUnique.mockResolvedValue(null);

      await expect(
        service.getDecryptedCredentials('unknown-provider-account'),
      ).rejects.toThrow(NotFoundException);

      expect(credentialsCrypto.decrypt).not.toHaveBeenCalled();
    });
  });
});
