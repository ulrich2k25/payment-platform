import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { SandboxProviderCallbackDto } from './dto/sandbox-provider-callback.dto';

@Injectable()
export class ProviderCallbacksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooksService: WebhooksService,
  ) {}

  async handleSandboxCallback(
    callbackSecret: string | undefined,
    input: SandboxProviderCallbackDto,
  ) {
    this.assertSandboxCallbackSecret(callbackSecret);

    const transaction = await this.prisma.transaction.findFirst({
      where: {
        provider: PaymentProvider.SANDBOX,
        providerReference: input.providerReference,
      },
      include: {
        payment: {
          include: {
            merchant: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException('Provider transaction not found');
    }

    const payment = transaction.payment;

    const transactionStatus =
      input.status === 'COMPLETED'
        ? TransactionStatus.COMPLETED
        : TransactionStatus.FAILED;

    const paymentStatus =
      input.status === 'COMPLETED'
        ? PaymentStatus.COMPLETED
        : PaymentStatus.FAILED;

    if (
      payment.status === PaymentStatus.COMPLETED ||
      payment.status === PaymentStatus.FAILED
    ) {
      return {
        received: true,
        processed: false,
        duplicate: true,
        paymentId: payment.id,
        status: payment.status,
      };
    }

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.updateMany({
        where: {
          id: payment.id,
          status: {
            in: [
              PaymentStatus.PENDING,
              PaymentStatus.PROCESSING,
              PaymentStatus.REQUIRES_RECONCILIATION,
            ],
          },
        },
        data: {
          status: paymentStatus,
        },
      });

      if (claimed.count === 0) {
        const currentPayment = await tx.payment.findUnique({
          where: {
            id: payment.id,
          },
        });

        return {
          received: true,
          processed: false,
          duplicate: true,
          paymentId: payment.id,
          status: currentPayment?.status ?? payment.status,
        };
      }

      await tx.transaction.update({
        where: {
          id: transaction.id,
        },
        data: {
          status: transactionStatus,
        },
      });

      if (
        paymentStatus === PaymentStatus.COMPLETED &&
        payment.merchant.webhookUrl
      ) {
        await this.webhooksService.sendPaymentCompleted(
          payment.merchant.webhookUrl,
          {
            id: payment.id,
            merchantId: payment.merchantId,
            amount: payment.amount,
            currency: payment.currency,
            reference: payment.reference,
          },
          tx,
        );
      }

      return {
        received: true,
        processed: true,
        duplicate: false,
        paymentId: payment.id,
        status: paymentStatus,
      };
    });
  }

  private assertSandboxCallbackSecret(
    callbackSecret: string | undefined,
  ): void {
    const expectedSecret = process.env.SANDBOX_CALLBACK_SECRET;

    if (!expectedSecret) {
      throw new UnauthorizedException(
        'Sandbox callback secret is not configured',
      );
    }

    if (!callbackSecret || callbackSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid sandbox callback secret');
    }
  }
}
