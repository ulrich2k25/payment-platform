import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { MerchantSessionGuard } from '../merchant-auth/merchant-session.guard';
import { MerchantsService } from '../merchants/merchants.service';
import { UpdateWebhookDto } from '../merchants/dto/update-webhook.dto';

import { ListMerchantWebhooksQueryDto } from './dto/list-merchant-webhooks-query.dto';
import { WebhooksService } from './webhooks.service';

type MerchantRequest = {
  merchant: {
    id: string;
  };
};

@Controller('merchant/webhooks')
@UseGuards(MerchantSessionGuard)
export class MerchantDashboardWebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly merchantsService: MerchantsService,
  ) {}

  @Get('config')
  getConfiguration(@Req() request: MerchantRequest) {
    return this.merchantsService.getWebhookConfiguration(request.merchant.id);
  }

  @Patch('config')
  updateConfiguration(
    @Req() request: MerchantRequest,
    @Body() body: UpdateWebhookDto,
  ) {
    return this.merchantsService.updateWebhookConfiguration(
      request.merchant.id,
      body.webhookUrl,
    );
  }

  @Post('secret/rotate')
  rotateSecret(@Req() request: MerchantRequest) {
    return this.merchantsService.rotateWebhookSecret(request.merchant.id);
  }

  @Get()
  listDeliveries(
    @Req() request: MerchantRequest,
    @Query()
    query: ListMerchantWebhooksQueryDto,
  ) {
    return this.webhooksService.listMerchantDeliveries(
      request.merchant.id,
      query,
    );
  }

  @Get(':id')
  getDelivery(@Req() request: MerchantRequest, @Param('id') id: string) {
    return this.webhooksService.getMerchantDeliveryById(
      request.merchant.id,
      id,
    );
  }
}
