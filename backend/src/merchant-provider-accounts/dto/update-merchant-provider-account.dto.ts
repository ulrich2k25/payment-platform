import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MerchantProviderAccountStatus } from '../../../generated/prisma/client';

export class UpdateMerchantProviderAccountDto {
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
  @IsString()
  @MaxLength(255)
  externalAccountId?: string;

  @IsOptional()
  @IsObject()
  configuration?: Record<string, unknown>;
}
