import {
  Body,
  Controller,
  ForbiddenException,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { MerchantUserRole } from '../../generated/prisma/client';
import { MerchantSessionGuard } from '../merchant-auth/merchant-session.guard';

import { UpdateMerchantSettingsDto } from './dto/update-merchant-settings.dto';
import { MerchantSettingsService } from './merchant-settings.service';

type MerchantRequest = {
  merchant: {
    id: string;
  };
  merchantUser: {
    role: MerchantUserRole;
  };
};

@Controller('merchant/settings')
@UseGuards(MerchantSessionGuard)
export class MerchantSettingsController {
  constructor(
    private readonly merchantSettingsService: MerchantSettingsService,
  ) {}

  @Patch('profile')
  updateProfile(
    @Req() request: MerchantRequest,
    @Body() dto: UpdateMerchantSettingsDto,
  ) {
    this.assertCanManage(request);

    return this.merchantSettingsService.updateProfile(request.merchant.id, dto);
  }

  private assertCanManage(request: MerchantRequest): void {
    if (
      request.merchantUser.role !== MerchantUserRole.OWNER &&
      request.merchantUser.role !== MerchantUserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only merchant owners and admins can update merchant settings',
      );
    }
  }
}
