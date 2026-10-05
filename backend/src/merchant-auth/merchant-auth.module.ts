import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { MerchantAuthController } from './merchant-auth.controller';
import { MerchantAuthService } from './merchant-auth.service';
import { MerchantSessionGuard } from './merchant-session.guard';

@Module({
  imports: [ThrottlerModule],
  controllers: [MerchantAuthController],
  providers: [MerchantAuthService, MerchantSessionGuard],
  exports: [MerchantAuthService, MerchantSessionGuard],
})
export class MerchantAuthModule {}
