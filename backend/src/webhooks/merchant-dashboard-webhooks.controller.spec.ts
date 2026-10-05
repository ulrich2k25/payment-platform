import { ForbiddenException } from '@nestjs/common';

import { MerchantUserRole } from '../../generated/prisma/client';
import { MerchantsService } from '../merchants/merchants.service';

import { MerchantDashboardWebhooksController } from './merchant-dashboard-webhooks.controller';
import { WebhooksService } from './webhooks.service';

describe('MerchantDashboardWebhooksController', () => {
  let controller: MerchantDashboardWebhooksController;
  let webhooksService: {
    replayMerchantExhaustedDelivery: jest.Mock;
  };
  let merchantsService: {
    updateWebhookConfiguration: jest.Mock;
    rotateWebhookSecret: jest.Mock;
  };

  function createRequest(role: MerchantUserRole) {
    return {
      merchant: {
        id: 'merchant-1',
      },
      merchantUser: {
        role,
      },
    };
  }

  beforeEach(() => {
    webhooksService = {
      replayMerchantExhaustedDelivery: jest.fn(),
    };

    merchantsService = {
      updateWebhookConfiguration: jest.fn(),
      rotateWebhookSecret: jest.fn(),
    };

    controller = new MerchantDashboardWebhooksController(
      webhooksService as unknown as WebhooksService,
      merchantsService as unknown as MerchantsService,
    );
  });

  it.each([MerchantUserRole.OWNER, MerchantUserRole.ADMIN])(
    'allows %s to update webhook configuration',
    async (role) => {
      merchantsService.updateWebhookConfiguration.mockResolvedValue({
        webhookUrl: 'https://merchant.example.com/webhooks/payment',
      });

      const result = await controller.updateConfiguration(createRequest(role), {
        webhookUrl: 'https://merchant.example.com/webhooks/payment',
      });

      expect(merchantsService.updateWebhookConfiguration).toHaveBeenCalledWith(
        'merchant-1',
        'https://merchant.example.com/webhooks/payment',
      );

      expect(result).toEqual({
        webhookUrl: 'https://merchant.example.com/webhooks/payment',
      });
    },
  );

  it.each([MerchantUserRole.DEVELOPER, MerchantUserRole.VIEWER])(
    'rejects %s when updating webhook configuration',
    async (role) => {
      expect(() =>
        controller.updateConfiguration(createRequest(role), {
          webhookUrl: 'https://merchant.example.com/webhooks/payment',
        }),
      ).toThrow(ForbiddenException);

      expect(
        merchantsService.updateWebhookConfiguration,
      ).not.toHaveBeenCalled();
    },
  );

  it.each([MerchantUserRole.OWNER, MerchantUserRole.ADMIN])(
    'allows %s to rotate the webhook secret',
    async (role) => {
      merchantsService.rotateWebhookSecret.mockResolvedValue({
        webhookSecret: 'rotated-secret',
      });

      const result = await controller.rotateSecret(createRequest(role));

      expect(merchantsService.rotateWebhookSecret).toHaveBeenCalledWith(
        'merchant-1',
      );

      expect(result).toEqual({
        webhookSecret: 'rotated-secret',
      });
    },
  );

  it.each([MerchantUserRole.DEVELOPER, MerchantUserRole.VIEWER])(
    'rejects %s when rotating the webhook secret',
    (role) => {
      expect(() => controller.rotateSecret(createRequest(role))).toThrow(
        ForbiddenException,
      );

      expect(merchantsService.rotateWebhookSecret).not.toHaveBeenCalled();
    },
  );

  it.each([MerchantUserRole.OWNER, MerchantUserRole.ADMIN])(
    'allows %s to replay an exhausted webhook delivery',
    async (role) => {
      webhooksService.replayMerchantExhaustedDelivery.mockResolvedValue({
        id: 'delivery-1',
        replayed: true,
      });

      const result = await controller.replayDelivery(
        createRequest(role),
        'delivery-1',
      );

      expect(
        webhooksService.replayMerchantExhaustedDelivery,
      ).toHaveBeenCalledWith('merchant-1', 'delivery-1');

      expect(result).toEqual({
        id: 'delivery-1',
        replayed: true,
      });
    },
  );

  it.each([MerchantUserRole.DEVELOPER, MerchantUserRole.VIEWER])(
    'rejects %s when replaying a webhook delivery',
    (role) => {
      expect(() =>
        controller.replayDelivery(createRequest(role), 'delivery-1'),
      ).toThrow(ForbiddenException);

      expect(
        webhooksService.replayMerchantExhaustedDelivery,
      ).not.toHaveBeenCalled();
    },
  );
});
