import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { MerchantUserRole } from '../../generated/prisma/client';
import { MerchantSessionGuard } from '../merchant-auth/merchant-session.guard';
import { UpdateMerchantDashboardProviderAccountDto } from './dto/update-merchant-dashboard-provider-account.dto';
import { UpdateProviderCredentialsDto } from './dto/update-provider-credentials.dto';
import { MerchantDashboardProviderAccountsService } from './merchant-dashboard-provider-accounts.service';

type MerchantRequest = {
  merchant: {
    id: string;
  };
  merchantUser: {
    role: MerchantUserRole;
  };
};

@Controller('merchant/provider-accounts')
@UseGuards(MerchantSessionGuard)
export class MerchantDashboardProviderAccountsController {
  constructor(
    private readonly merchantDashboardProviderAccountsService: MerchantDashboardProviderAccountsService,
  ) {}

  @Get()
  findAll(@Req() request: MerchantRequest) {
    return this.merchantDashboardProviderAccountsService.findAll(
      request.merchant.id,
    );
  }

  @Patch(':id')
  update(
    @Req() request: MerchantRequest,
    @Param('id') id: string,
    @Body() body: UpdateMerchantDashboardProviderAccountDto,
  ) {
    this.assertCanManage(request);

    return this.merchantDashboardProviderAccountsService.update(
      request.merchant.id,
      id,
      body,
    );
  }

  @Put(':id/credentials')
  updateCredentials(
    @Req() request: MerchantRequest,
    @Param('id') id: string,
    @Body() body: UpdateProviderCredentialsDto,
  ) {
    this.assertCanManage(request);

    return this.merchantDashboardProviderAccountsService.updateCredentials(
      request.merchant.id,
      id,
      body.credentials,
    );
  }

  private assertCanManage(request: MerchantRequest): void {
    if (
      request.merchantUser.role !== MerchantUserRole.OWNER &&
      request.merchantUser.role !== MerchantUserRole.ADMIN
    ) {
      throw new ForbiddenException(
        'Only merchant owners and admins can manage provider accounts',
      );
    }
  }
}
