import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';
import {
  PaymentProvider,
  PaymentStatus,
  TransactionStatus,
} from '../../generated/prisma/client';
import { MerchantProviderAccountsService } from '../merchant-provider-accounts/merchant-provider-accounts.service';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { FapshiProviderCallbackDto } from './dto/fapshi-provider-callback.dto';
import { SandboxProviderCallbackDto } from './dto/sandbox-provider-callback.dto';

@Injectable()
export class ProviderCallbacksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooksService: WebhooksService,
    private readonly merchantProviderAccountsService: MerchantProviderAccountsService,
  ) {}

  async handleSandboxCallback(
    callbackSecret: string | undefined,
    input: SandboxProviderCallbackDto,
  ) {
    this.assertSandboxCallbackSecret(
      callbackSecret,
    );

    const transaction =
      await this.prisma.transaction.findFirst({
        where: {
          provider: PaymentProvider.SANDBOX,
          providerReference:
            input.providerReference,
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
      throw new NotFoundException(
        'Provider transaction not found',
      );
    }

    const transactionStatus =
      input.status === 'COMPLETED'
        ? TransactionStatus.COMPLETED
        : TransactionStatus.FAILED;

    const paymentStatus =
      input.status === 'COMPLETED'
        ? PaymentStatus.COMPLETED
        : PaymentStatus.FAILED;

    return this.processTerminalCallback(
      transaction,
      transactionStatus,
      paymentStatus,
    );
  }

  async handleFapshiCallback(
    webhookSecret: string | undefined,
    input: FapshiProviderCallbackDto,
  ) {
    const transaction =
      await this.prisma.transaction.findFirst({
        where: {
          provider: PaymentProvider.FAPSHI,
          providerReference:
            input.transId,
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
      throw new NotFoundException(
        'Provider transaction not found',
      );
    }

    if (!transaction.providerAccountId) {
      throw new UnauthorizedException(
        'Fapshi provider account is not available',
      );
    }

    const credentials =
      await this.merchantProviderAccountsService
        .getDecryptedCredentials(
          transaction.providerAccountId,
        );

    this.assertFapshiWebhookSecret(
      webhookSecret,
      credentials.webhooksecret,
    );

    /*
     * We send Payment.id to Fapshi as externalId.
     * If Fapshi returns externalId, verify that it
     * belongs to the same local payment.
     */
    if (
      input.externalId &&
      input.externalId !== transaction.payment.id
    ) {
      throw new UnauthorizedException(
        'Fapshi webhook payment reference mismatch',
      );
    }

    const successful =
      input.status === 'SUCCESSFUL';

    const transactionStatus = successful
      ? TransactionStatus.COMPLETED
      : TransactionStatus.FAILED;

    const paymentStatus = successful
      ? PaymentStatus.COMPLETED
      : PaymentStatus.FAILED;

    return this.processTerminalCallback(
      transaction,
      transactionStatus,
      paymentStatus,
    );
  }

  private async processTerminalCallback(
    transaction: any,
    transactionStatus: TransactionStatus,
    paymentStatus: PaymentStatus,
  ) {
    const payment = transaction.payment;

    if (
      payment.status ===
        PaymentStatus.COMPLETED ||
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

    return this.prisma.$transaction(
      async (tx) => {
        /*
         * Atomic claim:
         * only one concurrent callback/poller can
         * move this payment to a terminal state.
         */
        const claimed =
          await tx.payment.updateMany({
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
          const currentPayment =
            await tx.payment.findUnique({
              where: {
                id: payment.id,
              },
            });

          return {
            received: true,
            processed: false,
            duplicate: true,
            paymentId: payment.id,
            status:
              currentPayment?.status ??
              payment.status,
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
          paymentStatus ===
            PaymentStatus.COMPLETED &&
          payment.merchant.webhookUrl
        ) {
          await this.webhooksService
            .sendPaymentCompleted(
              payment.merchant.webhookUrl,
              {
                id: payment.id,
                merchantId:
                  payment.merchantId,
                amount: payment.amount,
                currency: payment.currency,
                reference:
                  payment.reference,
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
      },
    );
  }

  private assertSandboxCallbackSecret(
    callbackSecret: string | undefined,
  ): void {
    const expectedSecret =
      process.env.SANDBOX_CALLBACK_SECRET;

    if (!expectedSecret) {
      throw new UnauthorizedException(
        'Sandbox callback secret is not configured',
      );
    }

    if (
      !callbackSecret ||
      !this.secureCompare(
        callbackSecret,
        expectedSecret,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid sandbox callback secret',
      );
    }
  }

  private assertFapshiWebhookSecret(
    receivedSecret: string | undefined,
    expectedSecret: string | undefined,
  ): void {
    if (!expectedSecret?.trim()) {
      throw new UnauthorizedException(
        'Fapshi webhook secret is not configured',
      );
    }

    if (
      !receivedSecret ||
      !this.secureCompare(
        receivedSecret,
        expectedSecret,
      )
    ) {
      throw new UnauthorizedException(
        'Invalid Fapshi webhook secret',
      );
    }
  }

  private secureCompare(
    first: string,
    second: string,
  ): boolean {
    const firstBuffer =
      Buffer.from(first, 'utf8');

    const secondBuffer =
      Buffer.from(second, 'utf8');

    if (
      firstBuffer.length !==
      secondBuffer.length
    ) {
      return false;
    }

    return timingSafeEqual(
      firstBuffer,
      secondBuffer,
    );
  }
}