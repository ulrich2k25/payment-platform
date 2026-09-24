import {
  Allow,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class FapshiProviderCallbackDto {
  @IsString()
  @IsNotEmpty()
  transId!: string;

  @IsString()
  @IsIn(['SUCCESSFUL', 'FAILED', 'EXPIRED'])
  status!: 'SUCCESSFUL' | 'FAILED' | 'EXPIRED';

  @IsOptional()
  @IsString()
  externalId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  // Additional fields officially included in Fapshi webhook payloads.
  // They are accepted by ValidationPipe but are not trusted for
  // payment identification or business processing.

  @Allow()
  medium?: unknown;

  @Allow()
  serviceName?: unknown;

  @Allow()
  transType?: unknown;

  @Allow()
  amount?: unknown;

  @Allow()
  revenue?: unknown;

  @Allow()
  payerName?: unknown;

  @Allow()
  email?: unknown;

  @Allow()
  redirectUrl?: unknown;

  @Allow()
  webhook?: unknown;

  @Allow()
  reason?: unknown;

  @Allow()
  financialTransId?: unknown;

  @Allow()
  dateInitiated?: unknown;

  @Allow()
  dateConfirmed?: unknown;
}