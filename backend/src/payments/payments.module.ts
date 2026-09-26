import { Module } from '@nestjs/common';

import { ApiKeysModule } from '../api-keys/api-keys.module';
import { MerchantAuthModule } from '../merchant-auth/merchant-auth.module';
import { MerchantProviderAccountsModule } from '../merchant-provider-accounts/merchant-provider-accounts.module';
import { ProvidersModule } from '../providers/providers.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

import { MerchantPaymentsController } from './merchant-payments.controller';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [
    ApiKeysModule,
    MerchantAuthModule,
    ProvidersModule,
    WebhooksModule,
    MerchantProviderAccountsModule,
  ],
  controllers: [PaymentsController, MerchantPaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
