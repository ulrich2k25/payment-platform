import { PrismaService } from '../prisma/prisma.service';
import { ProvidersService } from '../providers/providers.service';
import { WebhooksService } from '../webhooks/webhooks.service';
import { ReconciliationService } from './reconciliation.service';

describe('ReconciliationService', () => {
  let service: ReconciliationService;

  beforeEach(() => {
    const prisma = {} as PrismaService;
    const providersService = {} as ProvidersService;
    const webhooksService = {} as WebhooksService;

    service = new ReconciliationService(
      prisma,
      providersService,
      webhooksService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
