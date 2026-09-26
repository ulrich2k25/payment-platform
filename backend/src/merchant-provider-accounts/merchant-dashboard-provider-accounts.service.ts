import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
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
    dto: UpdateMerchantProviderAccountDto,
  ) {
    await this.assertBelongsToMerchant(merchantId, providerAccountId);

    return this.merchantProviderAccountsService.update(providerAccountId, dto);
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
        credentialsEncrypted: true,
      },
    });

    if (!account) {
      throw new NotFoundException('Merchant provider account not found');
    }

    return account;
  }
}
