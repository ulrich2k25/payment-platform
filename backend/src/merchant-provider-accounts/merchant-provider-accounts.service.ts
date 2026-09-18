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
  constructor(private readonly prisma: PrismaService) {}

  async findAllForMerchant(merchantId: string) {
    await this.assertMerchantExists(merchantId);

    return this.prisma.merchantProviderAccount.findMany({
      where: {
        merchantId,
      },
      select: providerAccountPublicSelect,
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
}
