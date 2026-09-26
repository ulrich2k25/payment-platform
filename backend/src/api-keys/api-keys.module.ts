import { Module } from '@nestjs/common';

import { MerchantAuthModule } from '../merchant-auth/merchant-auth.module';
import { ApiKeysController } from './api-keys.controller';
import { ApiKeysService } from './api-keys.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { MerchantApiKeysController } from './merchant-api-keys.controller';

@Module({
  imports: [MerchantAuthModule],
  controllers: [ApiKeysController, MerchantApiKeysController],
  providers: [ApiKeysService, ApiKeyGuard],
  exports: [ApiKeyGuard, ApiKeysService],
})
export class ApiKeysModule {}
