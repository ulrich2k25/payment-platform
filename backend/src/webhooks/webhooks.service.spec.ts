jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: {
    EVERY_MINUTE: '* * * * *',
  },
}));

jest.mock('node:dns/promises', () => ({
  lookup: jest.fn(),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { lookup } from 'node:dns/promises';
import { WebhookDeliveryStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WebhooksService } from './webhooks.service';

describe('WebhooksService', () => {
  let service: WebhooksService;

  const lookupMock = lookup as unknown as jest.Mock;

  const prismaMock = {
    webhookDelivery: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    lookupMock.mockResolvedValue([
      {
        address: '93.184.216.34',
        family: 4,
      },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhooksService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('does not send a webhook to a loopback address', async () => {
    prismaMock.webhookDelivery.findUnique.mockResolvedValue({
      id: 'delivery_test',
      merchantId: 'merchant_test',
      webhookUrl: 'http://127.0.0.1:4001/webhooks/payment',
      payload: {
        event: 'payment.completed',
      },
      status: WebhookDeliveryStatus.PROCESSING,
      attemptCount: 1,
      merchant: {
        webhookSecret: 'test_secret',
      },
    });

    prismaMock.webhookDelivery.update.mockResolvedValue({});

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const privateService = service as unknown as {
      processClaimedDelivery(deliveryId: string): Promise<void>;
    };

    await privateService.processClaimedDelivery('delivery_test');

    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  it('disables automatic redirects when sending a webhook', async () => {
    prismaMock.webhookDelivery.findUnique.mockResolvedValue({
      id: 'delivery_test',
      merchantId: 'merchant_test',
      webhookUrl: 'https://merchant.example/webhooks/payment',
      payload: {
        event: 'payment.completed',
      },
      status: WebhookDeliveryStatus.PROCESSING,
      attemptCount: 1,
      merchant: {
        webhookSecret: 'test_secret',
      },
    });

    prismaMock.webhookDelivery.update.mockResolvedValue({});

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const privateService = service as unknown as {
      processClaimedDelivery(deliveryId: string): Promise<void>;
    };

    await privateService.processClaimedDelivery('delivery_test');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://merchant.example/webhooks/payment',
      expect.objectContaining({
        redirect: 'manual',
      }),
    );

    fetchSpy.mockRestore();
  });

  it('rejects a public hostname that resolves to a private IP address', async () => {
    prismaMock.webhookDelivery.findUnique.mockResolvedValue({
      id: 'delivery_test',
      merchantId: 'merchant_test',
      webhookUrl: 'https://merchant.example/webhooks/payment',
      payload: {
        event: 'payment.completed',
      },
      status: WebhookDeliveryStatus.PROCESSING,
      attemptCount: 1,
      merchant: {
        webhookSecret: 'test_secret',
      },
    });

    prismaMock.webhookDelivery.update.mockResolvedValue({});

    lookupMock.mockResolvedValue([
      {
        address: '10.0.0.25',
        family: 4,
      },
    ]);

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
    } as Response);

    const privateService = service as unknown as {
      processClaimedDelivery(deliveryId: string): Promise<void>;
    };

    await privateService.processClaimedDelivery('delivery_test');

    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });
});
