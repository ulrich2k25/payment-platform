import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminSessionGuard } from './admin-session.guard';

@Module({
  imports: [ThrottlerModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminSessionGuard],
  exports: [AdminAuthService, AdminSessionGuard],
})
export class AdminAuthModule {}
