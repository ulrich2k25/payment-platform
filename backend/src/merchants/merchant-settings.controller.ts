import { Body, Controller, Patch, Req, UseGuards } from '@nestjs/common';

import { MerchantSessionGuard } from '../merchant-auth/merchant-session.guard';
import { UpdateMerchantSettingsDto } from './dto/update-merchant-settings.dto';
import { MerchantSettingsService } from './merchant-settings.service';

type MerchantRequest = {
  merchant: {
    id: string;
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
    return this.merchantSettingsService.updateProfile(request.merchant.id, dto);
  }
}
