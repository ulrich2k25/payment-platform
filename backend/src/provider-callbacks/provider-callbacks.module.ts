import { Module } from '@nestjs/common';
import { MerchantProviderAccountsModule } from '../merchant-provider-accounts/merchant-provider-accounts.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ProviderCallbacksController } from './provider-callbacks.controller';
import { ProviderCallbacksService } from './provider-callbacks.service';

@Module({
  imports: [
    WebhooksModule,
    MerchantProviderAccountsModule,
  ],
  controllers: [
    ProviderCallbacksController,
  ],
  providers: [
    ProviderCallbacksService,
  ],
})
export class ProviderCallbacksModule {}