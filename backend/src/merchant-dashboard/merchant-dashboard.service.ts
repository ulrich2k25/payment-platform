import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MerchantDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(merchantId: string) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      paymentBuckets,
      recentPayments,
      paymentsRequiringReconciliation,
      webhookIssues,
      activeProviderCount,
      activeApiKeyCount,
      merchant,
    ] = await Promise.all([
      this.prisma.payment.groupBy({
        by: ['status', 'currency'],
        where: {
          merchantId,
          createdAt: {
            gte: thirtyDaysAgo,
          },
        },
        _count: {
          _all: true,
        },
        _sum: {
          amount: true,
        },
      }),

      this.prisma.payment.findMany({
        where: {
          merchantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 5,
        select: {
          id: true,
          amount: true,
          currency: true,
          method: true,
          provider: true,
          reference: true,
          status: true,
          createdAt: true,
        },
      }),

      this.prisma.payment.count({
        where: {
          merchantId,
          status: 'REQUIRES_RECONCILIATION',
        },
      }),

      this.prisma.webhookDelivery.count({
        where: {
          merchantId,
          status: {
            in: ['FAILED', 'EXHAUSTED'],
          },
        },
      }),

      this.prisma.merchantProviderAccount.count({
        where: {
          merchantId,
          status: 'ACTIVE',
        },
      }),

      this.prisma.apiKey.count({
        where: {
          merchantId,
          status: 'ACTIVE',
        },
      }),

      this.prisma.merchant.findUnique({
        where: {
          id: merchantId,
        },
        select: {
          webhookUrl: true,
        },
      }),
    ]);

    const paymentCount = paymentBuckets.reduce(
      (total, bucket) => total + bucket._count._all,
      0,
    );

    const completedCount = paymentBuckets
      .filter((bucket) => bucket.status === 'COMPLETED')
      .reduce((total, bucket) => total + bucket._count._all, 0);

    const finalizedCount = paymentBuckets
      .filter((bucket) =>
        ['COMPLETED', 'FAILED', 'CANCELLED'].includes(bucket.status),
      )
      .reduce((total, bucket) => total + bucket._count._all, 0);

    const successRate =
      finalizedCount > 0
        ? Math.round((completedCount / finalizedCount) * 1000) / 10
        : null;

    const volumeByCurrencyMap = new Map<string, number>();

    for (const bucket of paymentBuckets) {
      const currentAmount = volumeByCurrencyMap.get(bucket.currency) ?? 0;
      const bucketAmount = bucket._sum.amount ?? 0;

      volumeByCurrencyMap.set(bucket.currency, currentAmount + bucketAmount);
    }

    const volumeByCurrency = Array.from(volumeByCurrencyMap.entries())
      .map(([currency, amount]) => ({
        currency,
        amount,
      }))
      .sort((a, b) => a.currency.localeCompare(b.currency));

    return {
      period: {
        days: 30,
        from: thirtyDaysAgo,
        to: new Date(),
      },

      payments: {
        count: paymentCount,
        completedCount,
        finalizedCount,
        successRate,
        volumeByCurrency,
      },

      attention: {
        paymentsRequiringReconciliation,
        webhookIssues,
        total: paymentsRequiringReconciliation + webhookIssues,
      },

      infrastructure: {
        activeProviderCount,
        hasActiveProvider: activeProviderCount > 0,
        activeApiKeyCount,
        hasActiveApiKey: activeApiKeyCount > 0,
        webhookConfigured: Boolean(merchant?.webhookUrl?.trim()),
      },

      recentPayments,
    };
  }
}
