import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { MerchantUserRole } from '../../generated/prisma/client';
import { MerchantSessionGuard } from '../merchant-auth/merchant-session.guard';

import { ApiKeysService } from './api-keys.service';

type MerchantRequest = {
  merchant: {
    id: string;
  };
  merchantUser: {
    role: MerchantUserRole;
  };
};

@Controller('merchant/api-keys')
@UseGuards(MerchantSessionGuard)
export class MerchantApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  create(@Req() request: MerchantRequest) {
    this.assertCanManage(request);

    return this.apiKeysService.createForMerchant(request.merchant.id);
  }

  @Get()
  findAll(@Req() request: MerchantRequest) {
    return this.apiKeysService.findAllForMerchant(request.merchant.id);
  }

  @Patch(':id/revoke')
  revoke(@Req() request: MerchantRequest, @Param('id') id: string) {
    this.assertCanManage(request);

    return this.apiKeysService.revokeForMerchant(request.merchant.id, id);
  }

  private assertCanManage(request: MerchantRequest): void {
    if (request.merchantUser.role === MerchantUserRole.VIEWER) {
      throw new ForbiddenException(
        'Viewers cannot create or revoke merchant API keys',
      );
    }
  }
}
