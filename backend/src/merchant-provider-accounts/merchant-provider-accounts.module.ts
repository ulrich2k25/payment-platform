import { Module } from '@nestjs/common';
import { MerchantProviderAccountsController } from './merchant-provider-accounts.controller';
import { MerchantProviderAccountsService } from './merchant-provider-accounts.service';

@Module({
  controllers: [MerchantProviderAccountsController],
  providers: [MerchantProviderAccountsService],
  exports: [MerchantProviderAccountsService],
})
export class MerchantProviderAccountsModule {}
