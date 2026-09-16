import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  PaymentStatus,
  TransactionStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name);

  private reconciliationRunning = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async reconcilePayment(merchantId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        merchantId,
      },
      include: {
        merchant: true,
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.REQUIRES_RECONCILIATION) {
      return payment;
    }

    const transaction = payment.transactions[0];

    if (!transaction || !transaction.providerReference) {
      this.logger.warn(
        `Payment ${payment.id} cannot be reconciled because no provider reference is available`,
      );

      return payment;
    }

    const provider = this.providersService.getProvider(transaction.provider);

    const providerResult = await provider.getPaymentStatus({
      providerReference: transaction.providerReference,
    });

    const providerStatus = providerResult.status;

    const paymentStatus =
      providerStatus === TransactionStatus.COMPLETED
        ? PaymentStatus.COMPLETED
        : providerStatus === TransactionStatus.FAILED
          ? PaymentStatus.FAILED
          : PaymentStatus.REQUIRES_RECONCILIATION;

    const updatedPayment = await this.prisma.$transaction(async (tx) => {
      await tx.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: providerStatus,
        },
      });

      const updated = await tx.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          status: paymentStatus,
        },
      });

      if (
        paymentStatus === PaymentStatus.COMPLETED &&
        payment.merchant.webhookUrl
      ) {
        await this.webhooksService.sendPaymentCompleted(
          payment.merchant.webhookUrl,
          {
            id: updated.id,
            merchantId: updated.merchantId,
            amount: updated.amount,
            currency: updated.currency,
            reference: updated.reference,
          },
          tx,
        );
      }

      return updated;
    });

    this.logger.log(
      `Payment ${payment.id} reconciled: provider=${providerStatus}, payment=${paymentStatus}`,
    );

    return updatedPayment;
  }

  async reconcilePendingPayments() {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.REQUIRES_RECONCILIATION,
      },
      select: {
        id: true,
        merchantId: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const results: Array<{
      paymentId: string;
      success: boolean;
      status?: PaymentStatus;
      error?: string;
    }> = [];

    for (const payment of payments) {
      try {
        const reconciledPayment = await this.reconcilePayment(
          payment.merchantId,
          payment.id,
        );

        results.push({
          paymentId: payment.id,
          success: true,
          status: reconciledPayment.status,
        });
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : 'Unknown reconciliation error';

        this.logger.error(
          `Failed to reconcile payment ${payment.id}: ${message}`,
        );

        results.push({
          paymentId: payment.id,
          success: false,
          error: message,
        });
      }
    }

    return {
      processed: payments.length,
      succeeded: results.filter((result) => result.success).length,
      failed: results.filter((result) => !result.success).length,
      results,
    };
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  async runAutomaticReconciliation() {
    if (this.reconciliationRunning) {
      this.logger.warn(
        'Automatic reconciliation skipped because a previous run is still active',
      );

      return;
    }

    this.reconciliationRunning = true;

    try {
      const result = await this.reconcilePendingPayments();

      if (result.processed > 0) {
        this.logger.log(
          `Automatic reconciliation completed: ${result.processed} processed, ${result.succeeded} succeeded, ${result.failed} failed`,
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown reconciliation error';

      this.logger.error(`Automatic reconciliation failed: ${message}`);
    } finally {
      this.reconciliationRunning = false;
    }
  }
}
