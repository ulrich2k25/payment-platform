import { Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../admin/guards/admin-api-key.guard';
import { ApiKeysService } from './api-keys.service';

@Controller('api-keys')
@UseGuards(AdminApiKeyGuard)
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post(':merchantId')
  createForMerchant(@Param('merchantId') merchantId: string) {
    return this.apiKeysService.createForMerchant(merchantId);
  }

  @Get('merchant/:merchantId')
  findAllForMerchant(@Param('merchantId') merchantId: string) {
    return this.apiKeysService.findAllForMerchant(merchantId);
  }

  @Patch(':id/revoke')
  revoke(@Param('id') id: string) {
    return this.apiKeysService.revoke(id);
  }
}
