import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
  Prisma,
  TransactionStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhooksService: WebhooksService,
    private readonly providersService: ProvidersService,
  ) {}

  async create(
    merchantId: string,
    amount: number,
    currency: string,
    method: PaymentMethod,
    reference: string,
    idempotencyKey?: string,
    payerPhoneNumber?: string,
    requestedProvider?: PaymentProvider,
  ) {
    const merchant = await this.prisma.merchant.findUnique({
      where: {
        id: merchantId,
      },
    });

    if (!merchant) {
      throw new NotFoundException('Merchant not found');
    }

    const providerType = requestedProvider ?? PaymentProvider.SANDBOX;

    if (
      providerType === PaymentProvider.MTN_MOMO &&
      method !== PaymentMethod.MOBILE_MONEY
    ) {
      throw new BadRequestException(
        'MTN MoMo can only be used with MOBILE_MONEY payments',
      );
    }

    if (idempotencyKey) {
      const existingPayment = await this.prisma.payment.findUnique({
        where: {
          merchantId_idempotencyKey: {
            merchantId,
            idempotencyKey,
          },
        },
      });

      if (existingPayment) {
        const sameRequest =
          existingPayment.amount === amount &&
          existingPayment.currency === currency &&
          existingPayment.method === method &&
          existingPayment.provider === providerType &&
          existingPayment.reference === reference;

        if (!sameRequest) {
          throw new BadRequestException(
            'Idempotency key has already been used with different payment data',
          );
        }

        return existingPayment;
      }
    }

    let payment;
    let transaction;

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const createdPayment = await tx.payment.create({
          data: {
            merchantId,
            amount,
            currency,
            method,
            provider: providerType,
            reference,
            idempotencyKey,
          },
        });

        const createdTransaction = await tx.transaction.create({
          data: {
            paymentId: createdPayment.id,
            provider: createdPayment.provider,
            amount: createdPayment.amount,
            currency: createdPayment.currency,
          },
        });

        return {
          payment: createdPayment,
          transaction: createdTransaction,
        };
      });

      payment = result.payment;
      transaction = result.transaction;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        if (idempotencyKey) {
          const existingPayment = await this.prisma.payment.findUnique({
            where: {
              merchantId_idempotencyKey: {
                merchantId,
                idempotencyKey,
              },
            },
          });

          if (existingPayment) {
            const sameRequest =
              existingPayment.amount === amount &&
              existingPayment.currency === currency &&
              existingPayment.method === method &&
              existingPayment.provider === providerType &&
              existingPayment.reference === reference;

            if (!sameRequest) {
              throw new BadRequestException(
                'Idempotency key has already been used with different payment data',
              );
            }

            return existingPayment;
          }
        }

        throw new ConflictException(
          'A payment with this reference already exists',
        );
      }

      throw error;
    }

    const provider = this.providersService.getProvider(payment.provider);

    let providerResult;

    try {
      providerResult = await provider.createPayment({
        paymentId: payment.id,
        merchantId,
        amount,
        currency,
        method,
        reference,
        payerPhoneNumber,
      });
    } catch {
      await this.prisma.$transaction([
        this.prisma.transaction.update({
          where: {
            id: transaction.id,
          },
          data: {
            status: TransactionStatus.FAILED,
          },
        }),

        this.prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            status: PaymentStatus.FAILED,
          },
        }),
      ]);

      throw new BadGatewayException('Payment provider request failed');
    }

    try {
      if (
        payment.provider === PaymentProvider.SANDBOX &&
        reference.startsWith('SANDBOX_RECONCILE_TEST')
      ) {
        throw new Error('Simulated local synchronization failure');
      }

      const [, updatedPayment] = await this.prisma.$transaction([
        this.prisma.transaction.update({
          where: {
            id: transaction.id,
          },
          data: {
            providerReference: providerResult.providerReference,
            status: providerResult.status,
          },
        }),

        this.prisma.payment.update({
          where: {
            id: payment.id,
          },
          data: {
            providerReference: providerResult.providerReference,
            status: providerResult.status,
          },
        }),
      ]);

      return updatedPayment;
    } catch {
      try {
        await this.prisma.$transaction([
          this.prisma.transaction.update({
            where: {
              id: transaction.id,
            },
            data: {
              providerReference: providerResult.providerReference,
              status: TransactionStatus.REQUIRES_RECONCILIATION,
            },
          }),

          this.prisma.payment.update({
            where: {
              id: payment.id,
            },
            data: {
              providerReference: providerResult.providerReference,
              status: PaymentStatus.REQUIRES_RECONCILIATION,
            },
          }),
        ]);
      } catch {
        // The provider may already have accepted the payment
        // while the local state could not be persisted.
        // Automated reconciliation will handle this scenario.
      }

      throw new ServiceUnavailableException(
        'Payment state requires reconciliation',
      );
    }
  }

  async findAll(merchantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [payments, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where: {
          merchantId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.payment.count({
        where: {
          merchantId,
        },
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: payments,
      meta: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  async findOne(merchantId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        merchantId,
      },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async completeSandboxPayment(merchantId: string, paymentId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        merchantId,
      },
      include: {
        merchant: true,
      },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.provider !== PaymentProvider.SANDBOX) {
      throw new BadRequestException(
        'Only sandbox payments can be completed manually',
      );
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Payment cannot be completed from status ${payment.status}`,
      );
    }

    const completedPayment = await this.prisma.$transaction(async (tx) => {
      const updatedPayment = await tx.payment.update({
        where: {
          id: paymentId,
        },
        data: {
          status: PaymentStatus.COMPLETED,
        },
      });

      await tx.transaction.updateMany({
        where: {
          paymentId,
          provider: PaymentProvider.SANDBOX,
        },
        data: {
          status: TransactionStatus.COMPLETED,
        },
      });

      if (payment.merchant.webhookUrl) {
        await this.webhooksService.sendPaymentCompleted(
          payment.merchant.webhookUrl,
          {
            id: updatedPayment.id,
            merchantId: updatedPayment.merchantId,
            amount: updatedPayment.amount,
            currency: updatedPayment.currency,
            reference: updatedPayment.reference,
          },
          tx,
        );
      }

      return updatedPayment;
    });

    return completedPayment;
  }
}
