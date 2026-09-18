import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  let service: PaymentsService;

  beforeEach(() => {
    const prisma = {} as PrismaService;
    const webhooksService = {} as WebhooksService;
    const providersService = {} as ProvidersService;

    service = new PaymentsService(prisma, webhooksService, providersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
