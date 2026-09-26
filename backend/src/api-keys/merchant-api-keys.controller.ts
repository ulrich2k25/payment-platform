import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { MerchantSessionGuard } from '../merchant-auth/merchant-session.guard';
import { ApiKeysService } from './api-keys.service';

@Controller('merchant/api-keys')
@UseGuards(MerchantSessionGuard)
export class MerchantApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@Req() req: any) {
    return this.apiKeysService.createForMerchant(req.merchant.id);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.apiKeysService.findAllForMerchant(req.merchant.id);
  }

  @Patch(':id/revoke')
  revoke(@Req() req: any, @Param('id') id: string) {
    return this.apiKeysService.revokeForMerchant(req.merchant.id, id);
  }
}
