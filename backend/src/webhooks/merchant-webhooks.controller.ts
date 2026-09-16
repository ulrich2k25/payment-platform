import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';

import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { ListMerchantWebhooksQueryDto } from './dto/list-merchant-webhooks-query.dto';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
@UseGuards(ApiKeyGuard)
export class MerchantWebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  async listWebhooks(
    @Req()
    request: {
      merchant: {
        id: string;
      };
    },
    @Query() query: ListMerchantWebhooksQueryDto,
  ) {
    return this.webhooksService.listMerchantDeliveries(
      request.merchant.id,
      query,
    );
  }

  @Get(':id')
  async getWebhookById(
    @Req()
    request: {
      merchant: {
        id: string;
      };
    },
    @Param('id') id: string,
  ) {
    return this.webhooksService.getMerchantDeliveryById(
      request.merchant.id,
      id,
    );
  }
}
