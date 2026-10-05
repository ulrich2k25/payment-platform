import { Module } from '@nestjs/common';

import { MerchantAuthModule } from '../merchant-auth/merchant-auth.module';
import { MerchantDashboardController } from './merchant-dashboard.controller';
import { MerchantDashboardService } from './merchant-dashboard.service';

@Module({
  imports: [MerchantAuthModule],
  controllers: [MerchantDashboardController],
  providers: [MerchantDashboardService],
})
export class MerchantDashboardModule {}
