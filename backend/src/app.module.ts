import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

import { AdminAuthModule } from './admin/auth/admin-auth.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MerchantAuthModule } from './merchant-auth/merchant-auth.module';
import { MerchantDashboardModule } from './merchant-dashboard/merchant-dashboard.module';
import { MerchantProviderAccountsModule } from './merchant-provider-accounts/merchant-provider-accounts.module';
import { MerchantsModule } from './merchants/merchants.module';
import { PaymentsModule } from './payments/payments.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProviderCallbacksModule } from './provider-callbacks/provider-callbacks.module';
import { ProvidersModule } from './providers/providers.module';
import { ReconciliationModule } from './reconciliation/reconciliation.module';
import { TransactionsModule } from './transactions/transactions.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ScheduleModule.forRoot(),

    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 10,
      },
    ]),

    PrismaModule,
    AdminAuthModule,
    MerchantsModule,
    ApiKeysModule,
    PaymentsModule,
    WebhooksModule,
    ProvidersModule,
    TransactionsModule,
    ReconciliationModule,
    ProviderCallbacksModule,
    MerchantProviderAccountsModule,
    MerchantAuthModule,
    MerchantDashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
