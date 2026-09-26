import { Module } from '@nestjs/common';

import { MerchantAuthController } from './merchant-auth.controller';
import { MerchantAuthService } from './merchant-auth.service';
import { MerchantSessionGuard } from './merchant-session.guard';

@Module({
  controllers: [MerchantAuthController],
  providers: [MerchantAuthService, MerchantSessionGuard],
  exports: [MerchantAuthService, MerchantSessionGuard],
})
export class MerchantAuthModule {}
