import {
  BadRequestException,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { MerchantSessionGuard } from '../merchant-auth/merchant-session.guard';
import { PaymentsService } from './payments.service';

@Controller('merchant/payments')
@UseGuards(MerchantSessionGuard)
export class MerchantPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  findAll(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe)
    limit: number,
  ) {
    if (page < 1) {
      throw new BadRequestException('Page must be greater than or equal to 1');
    }

    if (limit < 1 || limit > 100) {
      throw new BadRequestException('Limit must be between 1 and 100');
    }

    return this.paymentsService.findAll(req.merchant.id, page, limit);
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    return this.paymentsService.findOne(req.merchant.id, id);
  }
}
