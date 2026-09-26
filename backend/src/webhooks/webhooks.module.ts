import { Module } from '@nestjs/common';

import { ApiKeysModule } from '../api-keys/api-keys.module';
import { MerchantAuthModule } from '../merchant-auth/merchant-auth.module';
import { MerchantsModule } from '../merchants/merchants.module';

import { MerchantDashboardWebhooksController } from './merchant-dashboard-webhooks.controller';
import { MerchantWebhooksController } from './merchant-webhooks.controller';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';

@Module({
  imports: [ApiKeysModule, MerchantAuthModule, MerchantsModule],
  controllers: [
    WebhooksController,
    MerchantWebhooksController,
    MerchantDashboardWebhooksController,
  ],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}
