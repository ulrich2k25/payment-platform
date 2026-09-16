import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { createHmac } from 'crypto';
import { Prisma, WebhookDeliveryStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ListWebhooksQueryDto } from './dto/list-webhooks-query.dto';
import { ListMerchantWebhooksQueryDto } from './dto/list-merchant-webhooks-query.dto';
import { lookup } from 'node:dns/promises';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  private readonly maxAttempts = 5;

  private readonly processingLeaseMs = 2 * 60 * 1000;

  private workerRunning = false;

  constructor(private readonly prisma: PrismaService) {}

  async sendPaymentCompleted(
    webhookUrl: string,
    payment: {
      id: string;
      merchantId: string;
      amount: number;
      currency: string;
      reference: string;
    },
    tx?: Prisma.TransactionClient,
  ) {
    const payload = {
      event: 'payment.completed',
      data: {
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        reference: payment.reference,
      },
    };

    const client = tx ?? this.prisma;

    return client.webhookDelivery.create({
      data: {
        merchantId: payment.merchantId,
        paymentId: payment.id,
        event: 'payment.completed',
        webhookUrl,
        payload,
      },
    });
  }

  async replayExhaustedDelivery(deliveryId: string) {
    const now = new Date();

    const result = await this.prisma.webhookDelivery.updateMany({
      where: {
        id: deliveryId,
        status: WebhookDeliveryStatus.EXHAUSTED,
      },
      data: {
        status: WebhookDeliveryStatus.PENDING,
        attemptCount: 0,
        nextAttemptAt: now,
        processingStartedAt: null,
        replayCount: {
          increment: 1,
        },
        lastReplayedAt: now,
      },
    });

    if (result.count === 1) {
      this.logger.warn(`Webhook ${deliveryId} manually replayed by admin`);

      return {
        id: deliveryId,
        replayed: true,
        replayedAt: now,
      };
    }

    const existingDelivery = await this.prisma.webhookDelivery.findUnique({
      where: {
        id: deliveryId,
      },
      select: {
        id: true,
        status: true,
      },
    });

    if (!existingDelivery) {
      throw new NotFoundException(
        `Webhook delivery ${deliveryId} was not found`,
      );
    }

    throw new ConflictException(
      `Webhook delivery ${deliveryId} cannot be replayed from status ${existingDelivery.status}`,
    );
  }

  async listDeliveries(query: ListWebhooksQueryDto) {
    const { page, limit, status, merchantId, paymentId } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.WebhookDeliveryWhereInput = {
      ...(status && { status }),
      ...(merchantId && { merchantId }),
      ...(paymentId && { paymentId }),
    };

    const [deliveries, total] = await this.prisma.$transaction([
      this.prisma.webhookDelivery.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          event: true,
          webhookUrl: true,
          status: true,
          attemptCount: true,
          replayCount: true,
          nextAttemptAt: true,
          processingStartedAt: true,
          lastAttemptAt: true,
          lastReplayedAt: true,
          deliveredAt: true,
          responseCode: true,
          lastError: true,
          createdAt: true,
          updatedAt: true,

          merchant: {
            select: {
              id: true,
              name: true,
              email: true,
              status: true,
            },
          },

          payment: {
            select: {
              id: true,
              amount: true,
              currency: true,
              reference: true,
              provider: true,
              status: true,
            },
          },
        },
      }),

      this.prisma.webhookDelivery.count({
        where,
      }),
    ]);

    return {
      data: deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async listMerchantDeliveries(
    merchantId: string,
    query: ListMerchantWebhooksQueryDto,
  ) {
    const { page, limit, status } = query;

    const skip = (page - 1) * limit;

    const where: Prisma.WebhookDeliveryWhereInput = {
      merchantId,
      ...(status && { status }),
    };

    const [deliveries, total] = await this.prisma.$transaction([
      this.prisma.webhookDelivery.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
        select: {
          id: true,
          paymentId: true,
          event: true,
          status: true,
          attemptCount: true,
          replayCount: true,
          nextAttemptAt: true,
          lastAttemptAt: true,
          lastReplayedAt: true,
          deliveredAt: true,
          responseCode: true,
          lastError: true,
          createdAt: true,
          updatedAt: true,

          payment: {
            select: {
              id: true,
              amount: true,
              currency: true,
              reference: true,
              provider: true,
              status: true,
            },
          },
        },
      }),

      this.prisma.webhookDelivery.count({
        where,
      }),
    ]);

    return {
      data: deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
  async getMerchantDeliveryById(merchantId: string, deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findFirst({
      where: {
        id: deliveryId,
        merchantId,
      },
      select: {
        id: true,
        paymentId: true,
        event: true,
        webhookUrl: true,
        payload: true,
        status: true,

        attemptCount: true,
        replayCount: true,

        nextAttemptAt: true,
        processingStartedAt: true,
        lastAttemptAt: true,
        lastReplayedAt: true,
        deliveredAt: true,

        responseCode: true,
        lastError: true,

        createdAt: true,
        updatedAt: true,

        payment: {
          select: {
            id: true,
            amount: true,
            currency: true,
            method: true,
            provider: true,
            reference: true,
            providerReference: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(
        `Webhook delivery ${deliveryId} was not found`,
      );
    }

    return delivery;
  }
  async getDeliveryById(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: {
        id: deliveryId,
      },
      select: {
        id: true,
        event: true,
        webhookUrl: true,
        payload: true,
        status: true,

        attemptCount: true,
        replayCount: true,

        nextAttemptAt: true,
        processingStartedAt: true,
        lastAttemptAt: true,
        lastReplayedAt: true,
        deliveredAt: true,

        responseCode: true,
        lastError: true,

        createdAt: true,
        updatedAt: true,

        merchant: {
          select: {
            id: true,
            name: true,
            email: true,
            webhookUrl: true,
            status: true,
          },
        },

        payment: {
          select: {
            id: true,
            amount: true,
            currency: true,
            method: true,
            provider: true,
            reference: true,
            providerReference: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException(
        `Webhook delivery ${deliveryId} was not found`,
      );
    }

    return delivery;
  }
  @Cron(CronExpression.EVERY_MINUTE)
  async processPendingDeliveries() {
    if (this.workerRunning) {
      this.logger.warn(
        'Webhook worker skipped because a previous run is still active',
      );

      return;
    }

    this.workerRunning = true;

    try {
      const now = new Date();

      const staleProcessingBefore = new Date(
        now.getTime() - this.processingLeaseMs,
      );

      const deliveries = await this.prisma.webhookDelivery.findMany({
        where: {
          attemptCount: {
            lt: this.maxAttempts,
          },
          OR: [
            {
              status: {
                in: [
                  WebhookDeliveryStatus.PENDING,
                  WebhookDeliveryStatus.FAILED,
                ],
              },
              nextAttemptAt: {
                lte: now,
              },
            },
            {
              status: WebhookDeliveryStatus.PROCESSING,
              processingStartedAt: {
                lte: staleProcessingBefore,
              },
            },
          ],
        },
        orderBy: {
          createdAt: 'asc',
        },
        take: 50,
      });

      let claimedCount = 0;

      for (const delivery of deliveries) {
        const claimed = await this.claimDelivery(
          delivery.id,
          now,
          staleProcessingBefore,
        );

        if (!claimed) {
          continue;
        }

        claimedCount += 1;

        await this.processClaimedDelivery(delivery.id);
      }

      if (deliveries.length > 0) {
        this.logger.log(
          `Webhook worker found ${deliveries.length} candidate(s), claimed ${claimedCount}`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown webhook worker error';

      this.logger.error(`Webhook worker failed: ${message}`);
    } finally {
      this.workerRunning = false;
    }
  }

  private async claimDelivery(
    deliveryId: string,
    now: Date,
    staleProcessingBefore: Date,
  ) {
    const result = await this.prisma.webhookDelivery.updateMany({
      where: {
        id: deliveryId,
        attemptCount: {
          lt: this.maxAttempts,
        },
        OR: [
          {
            status: {
              in: [WebhookDeliveryStatus.PENDING, WebhookDeliveryStatus.FAILED],
            },
            nextAttemptAt: {
              lte: now,
            },
          },
          {
            status: WebhookDeliveryStatus.PROCESSING,
            processingStartedAt: {
              lte: staleProcessingBefore,
            },
          },
        ],
      },
      data: {
        status: WebhookDeliveryStatus.PROCESSING,
        processingStartedAt: now,
        lastAttemptAt: now,
        attemptCount: {
          increment: 1,
        },
      },
    });

    return result.count === 1;
  }

  private async processClaimedDelivery(deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findUnique({
      where: {
        id: deliveryId,
      },
      include: {
        merchant: true,
      },
    });

    if (!delivery) {
      return;
    }

    if (delivery.status !== WebhookDeliveryStatus.PROCESSING) {
      return;
    }

    const attemptNumber = delivery.attemptCount;

    let responseCode: number | null = null;

    try {
      if (!delivery.merchant.webhookSecret) {
        throw new Error(
          `Webhook secret is not configured for merchant ${delivery.merchantId}`,
        );
      }
      await this.assertWebhookUrlAllowed(delivery.webhookUrl);
      const payload = JSON.stringify(delivery.payload);

      const timestamp = Math.floor(Date.now() / 1000).toString();

      const signedPayload = `${timestamp}.${payload}`;

      const signature = createHmac('sha256', delivery.merchant.webhookSecret)
        .update(signedPayload)
        .digest('hex');

      const response = await fetch(delivery.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Id': delivery.id,
          'X-Webhook-Timestamp': timestamp,
          'X-Webhook-Signature': `sha256=${signature}`,
        },
        body: payload,
        redirect: 'manual',
        signal: AbortSignal.timeout(10_000),
      });

      responseCode = response.status;

      if (!response.ok) {
        throw new Error(`Webhook returned HTTP ${response.status}`);
      }

      await this.prisma.webhookDelivery.update({
        where: {
          id: delivery.id,
        },
        data: {
          status: WebhookDeliveryStatus.DELIVERED,
          processingStartedAt: null,
          deliveredAt: new Date(),
          lastError: null,
          responseCode,
        },
      });

      this.logger.log(`Webhook ${delivery.id} delivered successfully`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Unknown webhook delivery error';

      const exhausted = attemptNumber >= this.maxAttempts;

      if (exhausted) {
        await this.prisma.webhookDelivery.update({
          where: {
            id: delivery.id,
          },
          data: {
            status: WebhookDeliveryStatus.EXHAUSTED,
            processingStartedAt: null,
            lastError: message,
            responseCode,
          },
        });

        this.logger.error(
          `Webhook ${delivery.id} exhausted after ${attemptNumber}/${this.maxAttempts} attempts: ${message}`,
        );

        return;
      }

      const retryDelayMinutes = this.calculateRetryDelay(attemptNumber);

      await this.prisma.webhookDelivery.update({
        where: {
          id: delivery.id,
        },
        data: {
          status: WebhookDeliveryStatus.FAILED,
          processingStartedAt: null,
          lastError: message,
          responseCode,
          nextAttemptAt: new Date(Date.now() + retryDelayMinutes * 60 * 1000),
        },
      });

      this.logger.warn(
        `Webhook ${delivery.id} failed on attempt ${attemptNumber}/${this.maxAttempts}: ${message}`,
      );
    }
  }
  private async assertWebhookUrlAllowed(webhookUrl: string): Promise<void> {
    let url: URL;

    try {
      url = new URL(webhookUrl);
    } catch {
      throw new Error('Invalid webhook URL');
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
      throw new Error(
        'Webhook URL must not target localhost, loopback, or private network addresses',
      );
    }

    const normalizedHostname =
      hostname.startsWith('[') && hostname.endsWith(']')
        ? hostname.slice(1, -1)
        : hostname;

    const addresses = await lookup(normalizedHostname, {
      all: true,
      verbatim: true,
    });

    if (addresses.length === 0) {
      throw new Error('Webhook hostname did not resolve to any IP address');
    }

    for (const resolved of addresses) {
      if (this.isForbiddenResolvedAddress(resolved.address)) {
        throw new Error(
          'Webhook hostname resolves to a private or loopback address',
        );
      }
    }
  }

  private isForbiddenResolvedAddress(address: string): boolean {
    const normalized = address.toLowerCase();

    if (
      normalized === '::1' ||
      normalized.startsWith('127.') ||
      normalized.startsWith('10.') ||
      normalized.startsWith('192.168.') ||
      this.isPrivate172Range(normalized)
    ) {
      return true;
    }

    return false;
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
  private calculateRetryDelay(attemptNumber: number) {
    switch (attemptNumber) {
      case 1:
        return 1;

      case 2:
        return 5;

      case 3:
        return 15;

      case 4:
        return 30;

      default:
        return 60;
    }
  }
}
