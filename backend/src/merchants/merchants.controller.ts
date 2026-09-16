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
import { CreateMerchantDto } from './dto/create-merchant.dto';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { MerchantsService } from './merchants.service';

@Controller('merchants')
@UseGuards(AdminApiKeyGuard)
export class MerchantsController {
  constructor(private readonly merchantsService: MerchantsService) {}

  @Get()
  findAll() {
    return this.merchantsService.findAll();
  }

  @Post()
  create(@Body() body: CreateMerchantDto) {
    return this.merchantsService.create(body.name, body.email);
  }

  @Patch(':id/webhook')
  updateWebhookUrl(@Param('id') id: string, @Body() body: UpdateWebhookDto) {
    return this.merchantsService.updateWebhookUrl(id, body.webhookUrl);
  }
}
