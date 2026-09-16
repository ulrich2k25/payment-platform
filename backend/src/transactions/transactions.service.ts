import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(merchantId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: {
          payment: {
            merchantId,
          },
        },
        include: {
          payment: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),

      this.prisma.transaction.count({
        where: {
          payment: {
            merchantId,
          },
        },
      }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      data: transactions,
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

  async findOne(merchantId: string, transactionId: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id: transactionId,
        payment: {
          merchantId,
        },
      },
      include: {
        payment: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction not found');
    }

    return transaction;
  }
}
