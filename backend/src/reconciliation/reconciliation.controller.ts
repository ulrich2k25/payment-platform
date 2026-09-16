import { Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AdminApiKeyGuard } from '../admin/guards/admin-api-key.guard';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { ReconciliationService } from './reconciliation.service';

@Controller('reconciliation')
export class ReconciliationController {
  constructor(private readonly reconciliationService: ReconciliationService) {}

  @Post('payments/:id')
  @UseGuards(ApiKeyGuard)
  reconcilePayment(@Req() req: any, @Param('id') id: string) {
    return this.reconciliationService.reconcilePayment(req.merchant.id, id);
  }

  @Post('admin/run')
  @UseGuards(AdminApiKeyGuard)
  reconcilePendingPayments() {
    return this.reconciliationService.reconcilePendingPayments();
  }
}
