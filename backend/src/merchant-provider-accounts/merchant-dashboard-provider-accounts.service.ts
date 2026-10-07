import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MerchantProviderAccountStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateMerchantDashboardProviderAccountDto } from './dto/update-merchant-dashboard-provider-account.dto';
import { UpdateMerchantProviderAccountDto } from './dto/update-merchant-provider-account.dto';
import { MerchantProviderAccountsService } from './merchant-provider-accounts.service';

@Injectable()
export class MerchantDashboardProviderAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly merchantProviderAccountsService: MerchantProviderAccountsService,
  ) {}

  findAll(merchantId: string) {
    return this.merchantProviderAccountsService.findAllForMerchant(merchantId);
  }

  async update(
    merchantId: string,
    providerAccountId: string,
    dto: UpdateMerchantDashboardProviderAccountDto,
  ) {
    const account = await this.assertBelongsToMerchant(
      merchantId,
      providerAccountId,
    );

    if (
      dto.configuration &&
      account.provider.trim().toUpperCase() !== 'FAPSHI'
    ) {
      throw new BadRequestException(
        'Provider configuration is currently supported only for FAPSHI',
      );
    }

    await this.assertProviderReadyForUpdate(account, dto);

    const updateDto: UpdateMerchantProviderAccountDto = {
      status: dto.status,
      isDefault: dto.isDefault,
      priority: dto.priority,
      configuration: dto.configuration
        ? {
            ...this.toConfigurationRecord(account.configuration),
            ...(dto.configuration.paymentMode !== undefined
              ? {
                  paymentMode: dto.configuration.paymentMode,
                }
              : {}),
            ...(dto.configuration.redirectUrl !== undefined
              ? {
                  redirectUrl: dto.configuration.redirectUrl,
                }
              : {}),
          }
        : undefined,
    };

    return this.merchantProviderAccountsService.update(
      providerAccountId,
      updateDto,
    );
  }

  async updateCredentials(
    merchantId: string,
    providerAccountId: string,
    credentials: Record<string, unknown>,
  ) {
    const account = await this.assertBelongsToMerchant(
      merchantId,
      providerAccountId,
    );

    let existingCredentials: Record<string, string> = {};

    if (account.credentialsEncrypted) {
      existingCredentials =
        await this.merchantProviderAccountsService.getDecryptedCredentials(
          providerAccountId,
        );
    }

    const mergedCredentials = {
      ...existingCredentials,
      ...credentials,
    };

    return this.merchantProviderAccountsService.updateCredentials(
      providerAccountId,
      mergedCredentials,
    );
  }

  private async assertProviderReadyForUpdate(
    account: {
      id: string;
      provider: string;
      credentialsEncrypted: string | null;
      configuration: unknown;
    },
    dto: UpdateMerchantDashboardProviderAccountDto,
  ): Promise<void> {
    const provider = account.provider.trim().toUpperCase();

    if (provider !== 'FAPSHI') {
      return;
    }

    const requestsActivation =
      dto.status === MerchantProviderAccountStatus.ACTIVE ||
      dto.isDefault === true;

    if (!requestsActivation) {
      return;
    }

    if (!account.credentialsEncrypted) {
      throw new BadRequestException(
        'FAPSHI credentials must be configured before activation',
      );
    }

    const credentials =
      await this.merchantProviderAccountsService.getDecryptedCredentials(
        account.id,
      );

    const requiredCredentialNames = [
      'apiuser',
      'apikey',
      'webhooksecret',
    ] as const;

    const missingCredentials = requiredCredentialNames.filter((name) => {
      const value = credentials[name];

      return typeof value !== 'string' || value.trim().length === 0;
    });

    if (missingCredentials.length > 0) {
      throw new BadRequestException(
        'FAPSHI requires apiuser, apikey and webhooksecret before activation',
      );
    }
  }

  private async assertBelongsToMerchant(
    merchantId: string,
    providerAccountId: string,
  ) {
    const account = await this.prisma.merchantProviderAccount.findFirst({
      where: {
        id: providerAccountId,
        merchantId,
      },
      select: {
        id: true,
        provider: true,
        credentialsEncrypted: true,
        configuration: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Merchant provider account not found');
    }

    return account;
  }

  private toConfigurationRecord(
    configuration: unknown,
  ): Record<string, unknown> {
    if (
      configuration === null ||
      typeof configuration !== 'object' ||
      Array.isArray(configuration)
    ) {
      return {};
    }

    return {
      ...(configuration as Record<string, unknown>),
    };
  }
}
