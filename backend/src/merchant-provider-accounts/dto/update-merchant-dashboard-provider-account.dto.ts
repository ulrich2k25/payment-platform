import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

import { MerchantProviderAccountStatus } from '../../../generated/prisma/client';

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
}
