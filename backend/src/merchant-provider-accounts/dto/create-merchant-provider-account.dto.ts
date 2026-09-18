import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MerchantProviderAccountStatus } from '../../../generated/prisma/client';

export class CreateMerchantProviderAccountDto {
  @IsString()
  @Matches(/^[A-Za-z][A-Za-z0-9_]{1,49}$/, {
    message: 'provider must contain only letters, numbers and underscores',
  })
  provider!: string;

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
