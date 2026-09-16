import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { MerchantsModule } from './merchants/merchants.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProvidersModule } from './providers/providers.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ProviderCallbacksModule } from './provider-callbacks/provider-callbacks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    PrismaModule,
    MerchantsModule,
    ApiKeysModule,
    PaymentsModule,
    WebhooksModule,
    ProvidersModule,
    TransactionsModule,
    ReconciliationModule,
    ProviderCallbacksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
