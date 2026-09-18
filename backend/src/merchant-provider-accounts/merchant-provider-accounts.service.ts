import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MerchantProviderAccountStatus,
  Prisma,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProviderCredentialsCryptoService } from '../security/provider-credentials-crypto.service';
import { CreateMerchantProviderAccountDto } from './dto/create-merchant-provider-account.dto';
import { UpdateMerchantProviderAccountDto } from './dto/update-merchant-provider-account.dto';

const providerAccountPublicSelect = {
  id: true,
  merchantId: true,
  provider: true,
  status: true,
  isDefault: true,
  priority: true,
  externalAccountId: true,
  configuration: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MerchantProviderAccountSelect;

@Injectable()
export class MerchantProviderAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentialsCrypto: ProviderCredentialsCryptoService,
  ) {}

  async findAllForMerchant(merchantId: string) {
    await this.assertMerchantExists(merchantId);

    const accounts = await this.prisma.merchantProviderAccount.findMany({
      where: {
        merchantId,
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

    return accounts.map((account) => ({
      id: account.id,
      merchantId: account.merchantId,
      provider: account.provider,
      status: account.status,
      isDefault: account.isDefault,
      priority: account.priority,
      externalAccountId: account.externalAccountId,
      configuration: account.configuration,
      credentialsConfigured: Boolean(account.credentialsEncrypted),
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    }));
  }

  async create(merchantId: string, dto: CreateMerchantProviderAccountDto) {
    await this.assertMerchantExists(merchantId);

    const provider = this.normalizeProvider(dto.provider);

    const status = dto.status ?? MerchantProviderAccountStatus.INACTIVE;

    const isDefault = dto.isDefault ?? false;

    if (isDefault && status !== MerchantProviderAccountStatus.ACTIVE) {
      throw new BadRequestException(
        'A default provider account must be ACTIVE',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (isDefault) {
          await tx.merchantProviderAccount.updateMany({
            where: {
              merchantId,
              isDefault: true,
            },
            data: {
              isDefault: false,
            },
          });
        }

        return tx.merchantProviderAccount.create({
          data: {
            merchantId,
            provider,
            status,
            isDefault,
            priority: dto.priority ?? 100,
            externalAccountId: dto.externalAccountId,
            configuration: dto.configuration
              ? (dto.configuration as Prisma.InputJsonValue)
              : undefined,
          },
          select: providerAccountPublicSelect,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Provider ${provider} is already configured for this merchant`,
        );
      }

      throw error;
    }
  }

  async update(
    providerAccountId: string,
    dto: UpdateMerchantProviderAccountDto,
  ) {
    const existing = await this.prisma.merchantProviderAccount.findUnique({
      where: {
        id: providerAccountId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Merchant provider account not found');
    }

    const nextStatus = dto.status ?? existing.status;

    let nextIsDefault = dto.isDefault ?? existing.isDefault;

    if (nextStatus === MerchantProviderAccountStatus.INACTIVE) {
      nextIsDefault = false;
    }

    if (nextIsDefault && nextStatus !== MerchantProviderAccountStatus.ACTIVE) {
      throw new BadRequestException(
        'A default provider account must be ACTIVE',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (nextIsDefault) {
        await tx.merchantProviderAccount.updateMany({
          where: {
            merchantId: existing.merchantId,
            isDefault: true,
            NOT: {
              id: existing.id,
            },
          },
          data: {
            isDefault: false,
          },
        });
      }

      return tx.merchantProviderAccount.update({
        where: {
          id: providerAccountId,
        },
        data: {
          status: nextStatus,
          isDefault: nextIsDefault,
          priority: dto.priority,
          externalAccountId: dto.externalAccountId,
          configuration: dto.configuration
            ? (dto.configuration as Prisma.InputJsonValue)
            : undefined,
        },
        select: providerAccountPublicSelect,
      });
    });
  }

  async updateCredentials(
    providerAccountId: string,
    rawCredentials: Record<string, unknown>,
  ) {
    const account = await this.prisma.merchantProviderAccount.findUnique({
      where: {
        id: providerAccountId,
      },
    });

    if (!account) {
      throw new NotFoundException('Merchant provider account not found');
    }

    const credentials = this.validateAndNormalizeCredentials(rawCredentials);

    const context = this.getCredentialsContext(
      account.id,
      account.merchantId,
      account.provider,
    );

    const credentialsEncrypted = this.credentialsCrypto.encrypt(
      credentials,
      context,
    );

    const updated = await this.prisma.merchantProviderAccount.update({
      where: {
        id: providerAccountId,
      },
      data: {
        credentialsEncrypted,
      },
      select: providerAccountPublicSelect,
    });

    return {
      ...updated,
      credentialsConfigured: true,
    };
  }

  async findActiveAccount(merchantId: string, provider: string) {
    const normalizedProvider = this.normalizeProvider(provider);

    const account = await this.prisma.merchantProviderAccount.findFirst({
      where: {
        merchantId,
        provider: normalizedProvider,
        status: MerchantProviderAccountStatus.ACTIVE,
      },
    });

    if (!account) {
      throw new NotFoundException(
        `No active ${normalizedProvider} provider account configured for this merchant`,
      );
    }

    return account;
  }

  async getDecryptedCredentials(
    providerAccountId: string,
  ): Promise<Record<string, string>> {
    const account = await this.prisma.merchantProviderAccount.findUnique({
      where: {
        id: providerAccountId,
      },
    });

    if (!account) {
      throw new NotFoundException('Merchant provider account not found');
    }

    if (!account.credentialsEncrypted) {
      throw new BadRequestException(
        `Credentials are not configured for provider ${account.provider}`,
      );
    }

    const context = this.getCredentialsContext(
      account.id,
      account.merchantId,
      account.provider,
    );

    return this.credentialsCrypto.decrypt(
      account.credentialsEncrypted,
      context,
    );
  }

  private async assertMerchantExists(merchantId: string): Promise<void> {
    const merchant = await this.prisma.merchant.findUnique({
      where: {
        id: merchantId,
      },
      select: {
        id: true,
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }
  }

  private normalizeProvider(provider: string): string {
    return provider.trim().toUpperCase();
  }

  private validateAndNormalizeCredentials(
    rawCredentials: Record<string, unknown>,
  ): Record<string, string> {
    const entries = Object.entries(rawCredentials);

    if (entries.length === 0) {
      throw new BadRequestException(
        'At least one provider credential is required',
      );
    }

    const credentials: Record<string, string> = {};

    for (const [key, rawValue] of entries) {
      if (!/^[A-Za-z][A-Za-z0-9_]{0,99}$/.test(key)) {
        throw new BadRequestException(
          `Invalid provider credential name: ${key}`,
        );
      }

      if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
        throw new BadRequestException(
          `Provider credential ${key} must be a non-empty string`,
        );
      }

      if (rawValue.length > 4096) {
        throw new BadRequestException(`Provider credential ${key} is too long`);
      }

      credentials[key] = rawValue;
    }

    return credentials;
  }

  private getCredentialsContext(
    providerAccountId: string,
    merchantId: string,
    provider: string,
  ): string {
    return [
      'merchant-provider-account',
      providerAccountId,
      merchantId,
      provider,
    ].join(':');
  }
}
