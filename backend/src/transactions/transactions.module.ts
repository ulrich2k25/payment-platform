import { Module } from '@nestjs/common';

import { ApiKeysModule } from '../api-keys/api-keys.module';
import { MerchantAuthModule } from '../merchant-auth/merchant-auth.module';

import { MerchantTransactionsController } from './merchant-transactions.controller';
import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

@Module({
  imports: [ApiKeysModule, MerchantAuthModule],
  providers: [TransactionsService],
  controllers: [TransactionsController, MerchantTransactionsController],
})
export class TransactionsModule {}
