import { Module } from '@nestjs/common';

import { MerchantAuthModule } from '../merchant-auth/merchant-auth.module';
import { MerchantSettingsController } from './merchant-settings.controller';
import { MerchantSettingsService } from './merchant-settings.service';
import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';

@Module({
  imports: [MerchantAuthModule],
  controllers: [MerchantsController, MerchantSettingsController],
  providers: [MerchantsService, MerchantSettingsService],
  exports: [MerchantsService],
})
export class MerchantsModule {}
