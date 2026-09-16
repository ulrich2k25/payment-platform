import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(ApiKeyGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(
    @Req() req: any,
    @Headers('idempotency-key')
    idempotencyKey: string | undefined,
    @Body() body: CreatePaymentDto,
  ) {
    if (!idempotencyKey || !idempotencyKey.trim()) {
      throw new BadRequestException('Idempotency-Key header is required');
    }

    const normalizedIdempotencyKey = idempotencyKey.trim();

    if (normalizedIdempotencyKey.length > 100) {
      throw new BadRequestException(
        'Idempotency-Key must not exceed 100 characters',
      );
    }

    return this.paymentsService.create(
      req.merchant.id,
      body.amount,
      body.currency,
      body.method,
      body.reference,
      normalizedIdempotencyKey,
    );
  }

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

  @Post(':id/sandbox-complete')
  completeSandboxPayment(@Req() req: any, @Param('id') id: string) {
    return this.paymentsService.completeSandboxPayment(req.merchant.id, id);
  }
}
