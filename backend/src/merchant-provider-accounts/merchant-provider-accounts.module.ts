import { Module } from '@nestjs/common';

import { MerchantAuthModule } from '../merchant-auth/merchant-auth.module';
import { SecurityModule } from '../security/security.module';
import { MerchantDashboardProviderAccountsController } from './merchant-dashboard-provider-accounts.controller';
import { MerchantDashboardProviderAccountsService } from './merchant-dashboard-provider-accounts.service';
import { MerchantProviderAccountsController } from './merchant-provider-accounts.controller';
import { MerchantProviderAccountsService } from './merchant-provider-accounts.service';

@Module({
  imports: [SecurityModule, MerchantAuthModule],
  controllers: [
    MerchantProviderAccountsController,
    MerchantDashboardProviderAccountsController,
  ],
  providers: [
    MerchantProviderAccountsService,
    MerchantDashboardProviderAccountsService,
  ],
  exports: [MerchantProviderAccountsService],
})
export class MerchantProviderAccountsModule {}
