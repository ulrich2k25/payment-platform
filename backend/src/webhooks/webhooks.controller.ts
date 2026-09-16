import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';

import { AdminApiKeyGuard } from '../admin/guards/admin-api-key.guard';
import { ListWebhooksQueryDto } from './dto/list-webhooks-query.dto';
import { WebhooksService } from './webhooks.service';

@Controller('admin/webhooks')
@UseGuards(AdminApiKeyGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  async listWebhooks(@Query() query: ListWebhooksQueryDto) {
    return this.webhooksService.listDeliveries(query);
  }

  @Get(':id')
  async getWebhookById(@Param('id') id: string) {
    return this.webhooksService.getDeliveryById(id);
  }

  @Post(':id/replay')
  async replayWebhook(@Param('id') id: string) {
    return this.webhooksService.replayExhaustedDelivery(id);
  }
}
