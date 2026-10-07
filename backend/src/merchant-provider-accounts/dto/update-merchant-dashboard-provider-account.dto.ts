import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { MerchantProviderAccountStatus } from '../../../generated/prisma/client';

export enum MerchantProviderPaymentMode {
  DIRECT = 'DIRECT',
  HOSTED = 'HOSTED',
}

export class UpdateMerchantDashboardProviderConfigurationDto {
  @IsOptional()
  @IsEnum(MerchantProviderPaymentMode)
  paymentMode?: MerchantProviderPaymentMode;

  @IsOptional()
  @IsUrl({
    protocols: ['http', 'https'],
    require_protocol: true,
    require_tld: false,
  })
  redirectUrl?: string;
}

export class UpdateMerchantDashboardProviderAccountDto {
  @IsOptional()
  @IsEnum(MerchantProviderAccountStatus)
  status?: MerchantProviderAccountStatus;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1000)
  priority?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => UpdateMerchantDashboardProviderConfigurationDto)
  configuration?: UpdateMerchantDashboardProviderConfigurationDto;
}
