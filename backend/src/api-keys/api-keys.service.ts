import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';

import { ApiKeyStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ApiKeysService {
  constructor(private readonly prisma: PrismaService) {}

  async createForMerchant(merchantId: string) {
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

    const key = `sk_test_${randomBytes(24).toString('hex')}`;

    const keyHash = createHash('sha256').update(key).digest('hex');

    const apiKey = await this.prisma.apiKey.create({
      data: {
        keyHash,
        merchantId,
      },
    });

    return {
      id: apiKey.id,

      // Important:
      // this plaintext value is returned only
      // immediately after creation.
      key,

      merchantId: apiKey.merchantId,
      status: apiKey.status,
      createdAt: apiKey.createdAt,
    };
  }

  async findAllForMerchant(merchantId: string) {
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

    return this.prisma.apiKey.findMany({
      where: {
        merchantId,
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
  }

  async revoke(apiKeyId: string) {
    const apiKey = await this.prisma.apiKey.findUnique({
      where: {
        id: apiKeyId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.status === ApiKeyStatus.REVOKED) {
      throw new ConflictException('API key is already revoked');
    }

    return this.revokeApiKey(apiKey.id);
  }

  async revokeForMerchant(merchantId: string, apiKeyId: string) {
    const apiKey = await this.prisma.apiKey.findFirst({
      where: {
        id: apiKeyId,
        merchantId,
      },
    });

    if (!apiKey) {
      throw new NotFoundException('API key not found');
    }

    if (apiKey.status === ApiKeyStatus.REVOKED) {
      throw new ConflictException('API key is already revoked');
    }

    return this.revokeApiKey(apiKey.id);
  }

  private revokeApiKey(apiKeyId: string) {
    return this.prisma.apiKey.update({
      where: {
        id: apiKeyId,
      },
      data: {
        status: ApiKeyStatus.REVOKED,
        revokedAt: new Date(),
      },
      select: {
        id: true,
        merchantId: true,
        status: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }
}
