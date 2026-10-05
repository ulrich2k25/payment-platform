jest.mock('@nestjs/schedule', () => ({
  Cron: () => () => undefined,
  CronExpression: {
    EVERY_MINUTE: '* * * * *',
  },
}));

jest.mock('node:dns/promises', () => ({
  lookup: jest.fn(),
}));

import { NotFoundException } from '@nestjs/common';
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

  it('returns a merchant webhook delivery with its associated payment', async () => {
    const delivery = {
      id: 'delivery-1',
      paymentId: 'payment-1',
      event: 'payment.completed',
      webhookUrl: 'https://merchant.example/webhooks/payment',
      payload: {
        event: 'payment.completed',
        data: {
          id: 'payment-1',
          amount: 2500,
          currency: 'XAF',
          reference: 'ORDER-001',
        },
      },
      status: WebhookDeliveryStatus.DELIVERED,
      attemptCount: 1,
      replayCount: 0,
      nextAttemptAt: new Date('2026-10-05T10:00:00.000Z'),
      processingStartedAt: null,
      lastAttemptAt: new Date('2026-10-05T10:00:00.000Z'),
      lastReplayedAt: null,
      deliveredAt: new Date('2026-10-05T10:00:05.000Z'),
      responseCode: 200,
      lastError: null,
      createdAt: new Date('2026-10-05T10:00:00.000Z'),
      updatedAt: new Date('2026-10-05T10:00:05.000Z'),
      payment: {
        id: 'payment-1',
        amount: 2500,
        currency: 'XAF',
        method: 'MOBILE_MONEY',
        provider: 'FAPSHI',
        reference: 'ORDER-001',
        providerReference: 'provider-ref-001',
        status: 'COMPLETED',
        createdAt: new Date('2026-10-05T09:59:00.000Z'),
        updatedAt: new Date('2026-10-05T10:00:00.000Z'),
      },
    };

    prismaMock.webhookDelivery.findFirst.mockResolvedValue(delivery);

    const result = await service.getMerchantDeliveryById(
      'merchant-1',
      'delivery-1',
    );

    expect(prismaMock.webhookDelivery.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'delivery-1',
          merchantId: 'merchant-1',
        },
        select: expect.objectContaining({
          id: true,
          paymentId: true,
          event: true,
          webhookUrl: true,
          payload: true,
          status: true,
          attemptCount: true,
          replayCount: true,
          responseCode: true,
          lastError: true,
          payment: expect.any(Object),
        }),
      }),
    );

    expect(result).toEqual(delivery);
  });

  it('does not return a webhook delivery owned by another merchant', async () => {
    prismaMock.webhookDelivery.findFirst.mockResolvedValue(null);

    await expect(
      service.getMerchantDeliveryById(
        'merchant-1',
        'delivery-owned-by-merchant-2',
      ),
    ).rejects.toThrow(
      'Webhook delivery delivery-owned-by-merchant-2 was not found',
    );

    expect(prismaMock.webhookDelivery.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: 'delivery-owned-by-merchant-2',
          merchantId: 'merchant-1',
        },
      }),
    );
  });

  it('throws NotFoundException when the webhook delivery does not exist', async () => {
    prismaMock.webhookDelivery.findFirst.mockResolvedValue(null);

    await expect(
      service.getMerchantDeliveryById('merchant-1', 'missing-delivery'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
