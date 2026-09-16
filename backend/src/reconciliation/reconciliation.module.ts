import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';

@Module({
  imports: [ProvidersModule, WebhooksModule],
  controllers: [ReconciliationController],
  providers: [ReconciliationService],
})
export class ReconciliationModule {}
