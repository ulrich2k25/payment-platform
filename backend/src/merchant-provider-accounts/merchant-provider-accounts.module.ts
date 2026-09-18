import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module';
import { MerchantProviderAccountsController } from './merchant-provider-accounts.controller';
import { MerchantProviderAccountsService } from './merchant-provider-accounts.service';

@Module({
  imports: [SecurityModule],
  controllers: [MerchantProviderAccountsController],
  providers: [MerchantProviderAccountsService],
  exports: [MerchantProviderAccountsService],
})
export class MerchantProviderAccountsModule {}
