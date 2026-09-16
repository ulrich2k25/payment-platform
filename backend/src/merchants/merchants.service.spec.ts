import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MerchantsService } from './merchants.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MerchantsService', () => {
  let service: MerchantsService;

  const prismaMock = {
    merchant: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MerchantsService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get<MerchantsService>(MerchantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('rejects a webhook URL pointing to localhost IP', async () => {
    prismaMock.merchant.findUnique.mockResolvedValue({
      id: 'merchant_test',
    });

    await expect(
      service.updateWebhookUrl(
        'merchant_test',
        'http://127.0.0.1:4001/webhooks/payment',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.merchant.update).not.toHaveBeenCalled();
  });

  it('rejects a webhook URL pointing to a private 10.x.x.x address', async () => {
    prismaMock.merchant.findUnique.mockResolvedValue({
      id: 'merchant_test',
    });

    await expect(
      service.updateWebhookUrl(
        'merchant_test',
        'http://10.0.0.25/webhooks/payment',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.merchant.update).not.toHaveBeenCalled();
  });

  it('rejects a webhook URL pointing to a private 192.168.x.x address', async () => {
    prismaMock.merchant.findUnique.mockResolvedValue({
      id: 'merchant_test',
    });

    await expect(
      service.updateWebhookUrl(
        'merchant_test',
        'http://192.168.1.20/webhooks/payment',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.merchant.update).not.toHaveBeenCalled();
  });

  it('rejects a webhook URL pointing to a private 172.16-31.x.x address', async () => {
    prismaMock.merchant.findUnique.mockResolvedValue({
      id: 'merchant_test',
    });

    await expect(
      service.updateWebhookUrl(
        'merchant_test',
        'http://172.20.10.5/webhooks/payment',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.merchant.update).not.toHaveBeenCalled();
  });

  it('rejects a webhook URL pointing to the IPv6 loopback address', async () => {
    prismaMock.merchant.findUnique.mockResolvedValue({
      id: 'merchant_test',
    });

    await expect(
      service.updateWebhookUrl(
        'merchant_test',
        'http://[::1]:4001/webhooks/payment',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prismaMock.merchant.update).not.toHaveBeenCalled();
  });
});
