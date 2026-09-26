import { Module } from '@nestjs/common';

import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminSessionGuard } from './admin-session.guard';

@Module({
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminSessionGuard],
  exports: [AdminAuthService, AdminSessionGuard],
})
export class AdminAuthModule {}
