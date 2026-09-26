import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { UpdateMerchantSettingsDto } from './dto/update-merchant-settings.dto';

@Injectable()
export class MerchantSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async updateProfile(merchantId: string, dto: UpdateMerchantSettingsDto) {
    const merchant = await this.prisma.merchant.findUnique({
      where: {
        id: merchantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const nextName = dto.name !== undefined ? dto.name.trim() : undefined;

    const nextEmail =
      dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined;

    if (nextEmail && nextEmail !== merchant.email) {
      const existingMerchant = await this.prisma.merchant.findUnique({
        where: {
          email: nextEmail,
        },
        select: {
          id: true,
        },
      });

      if (existingMerchant && existingMerchant.id !== merchantId) {
        throw new ConflictException(
          'A merchant with this email already exists',
        );
      }
    }

    return this.prisma.merchant.update({
      where: {
        id: merchantId,
      },
      data: {
        ...(nextName !== undefined
          ? {
              name: nextName,
            }
          : {}),
        ...(nextEmail !== undefined
          ? {
              email: nextEmail,
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
