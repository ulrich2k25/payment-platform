import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  let service: TransactionsService;

  beforeEach(() => {
    const prisma = {} as PrismaService;

    service = new TransactionsService(prisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
