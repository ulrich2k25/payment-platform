import { Module } from '@nestjs/common';
import { MerchantProviderAccountsModule } from '../merchant-provider-accounts/merchant-provider-accounts.module';
import { ProvidersModule } from '../providers/providers.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';

@Module({
  imports: [
    ProvidersModule,
    WebhooksModule,
    MerchantProviderAccountsModule,
  ],
  controllers: [
    ReconciliationController,
  ],
  providers: [
    ReconciliationService,
  ],
  exports: [
    ReconciliationService,
  ],
})
export class ReconciliationModule {}