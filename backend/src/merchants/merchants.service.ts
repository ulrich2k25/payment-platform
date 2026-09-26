import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MerchantsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.merchant.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  create(name: string, email: string) {
    return this.prisma.merchant.create({
      data: {
        name,
        email,
      },
    });
  }

  async updateWebhookUrl(merchantId: string, webhookUrl: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: {
        id: merchantId,
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    this.assertWebhookUrlAllowed(webhookUrl);

    return this.prisma.merchant.update({
      where: {
        id: merchantId,
      },
      data: {
        webhookUrl,
      },
    });
  }

  async getWebhookConfiguration(merchantId: string) {
    const merchant = await this.prisma.merchant.findUnique({
      where: {
        id: merchantId,
      },
      select: {
        id: true,
        webhookUrl: true,
        webhookSecret: true,
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    return {
      webhookUrl: merchant.webhookUrl,
      webhookSecretConfigured: Boolean(merchant.webhookSecret),
    };
  }

  async updateWebhookConfiguration(merchantId: string, webhookUrl: string) {
    this.assertWebhookUrlAllowed(webhookUrl);

    const merchant = await this.prisma.merchant.findUnique({
      where: {
        id: merchantId,
      },
      select: {
        id: true,
        webhookSecret: true,
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    let generatedSecret: string | undefined;

    if (!merchant.webhookSecret) {
      generatedSecret = `whsec_${randomBytes(32).toString('hex')}`;
    }

    const updated = await this.prisma.merchant.update({
      where: {
        id: merchantId,
      },
      data: {
        webhookUrl,
        ...(generatedSecret
          ? {
              webhookSecret: generatedSecret,
            }
          : {}),
      },
      select: {
        webhookUrl: true,
      },
    });

    return {
      webhookUrl: updated.webhookUrl,
      webhookSecretConfigured: true,

      // Seulement présent lors de la
      // génération initiale.
      ...(generatedSecret
        ? {
            webhookSecret: generatedSecret,
          }
        : {}),
    };
  }

  async rotateWebhookSecret(merchantId: string) {
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

    const webhookSecret = `whsec_${randomBytes(32).toString('hex')}`;

    await this.prisma.merchant.update({
      where: {
        id: merchantId,
      },
      data: {
        webhookSecret,
      },
    });

    return {
      webhookSecret,
    };
  }

  private assertWebhookUrlAllowed(webhookUrl: string): void {
    let url: URL;

    try {
      url = new URL(webhookUrl);
    } catch {
      throw new BadRequestException('Invalid webhook URL');
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new BadRequestException('Webhook URL must use HTTP or HTTPS');
    }

    const hostname = url.hostname.toLowerCase();

    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname === '[::1]' ||
      hostname === '::1' ||
      this.isPrivate172Range(hostname)
    ) {
      throw new BadRequestException(
        'Webhook URL must not target localhost, loopback, or private network addresses',
      );
    }
  }

  private isPrivate172Range(hostname: string): boolean {
    const parts = hostname.split('.');

    if (parts.length !== 4 || parts[0] !== '172') {
      return false;
    }

    const secondOctet = Number(parts[1]);

    return (
      Number.isInteger(secondOctet) && secondOctet >= 16 && secondOctet <= 31
    );
  }
}
