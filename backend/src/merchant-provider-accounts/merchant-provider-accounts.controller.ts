import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminApiKeyGuard } from '../admin/guards/admin-api-key.guard';
import { CreateMerchantProviderAccountDto } from './dto/create-merchant-provider-account.dto';
import { UpdateMerchantProviderAccountDto } from './dto/update-merchant-provider-account.dto';
import { MerchantProviderAccountsService } from './merchant-provider-accounts.service';

@Controller('merchant-provider-accounts')
@UseGuards(AdminApiKeyGuard)
export class MerchantProviderAccountsController {
  constructor(
    private readonly merchantProviderAccountsService: MerchantProviderAccountsService,
  ) {}

  @Get('merchant/:merchantId')
  findAllForMerchant(@Param('merchantId') merchantId: string) {
    return this.merchantProviderAccountsService.findAllForMerchant(merchantId);
  }

  @Post('merchant/:merchantId')
  create(
    @Param('merchantId') merchantId: string,
    @Body() body: CreateMerchantProviderAccountDto,
  ) {
    return this.merchantProviderAccountsService.create(merchantId, body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateMerchantProviderAccountDto,
  ) {
    return this.merchantProviderAccountsService.update(id, body);
  }
}
