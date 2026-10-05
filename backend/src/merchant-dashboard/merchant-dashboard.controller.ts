import { Controller, Get, Req, UseGuards } from '@nestjs/common';

import { MerchantSessionGuard } from '../merchant-auth/merchant-session.guard';
import { MerchantDashboardService } from './merchant-dashboard.service';

@Controller('merchant/dashboard')
@UseGuards(MerchantSessionGuard)
export class MerchantDashboardController {
  constructor(
    private readonly merchantDashboardService: MerchantDashboardService,
  ) {}

  @Get('summary')
  getSummary(@Req() req: any) {
    return this.merchantDashboardService.getSummary(req.merchant.id);
  }
}
