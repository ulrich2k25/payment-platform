import { Module } from '@nestjs/common';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ProviderCallbacksController } from './provider-callbacks.controller';
import { ProviderCallbacksService } from './provider-callbacks.service';

@Module({
  imports: [WebhooksModule],
  controllers: [ProviderCallbacksController],
  providers: [ProviderCallbacksService],
})
export class ProviderCallbacksModule {}
