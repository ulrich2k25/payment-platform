import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import {
  PaymentMethod,
  PaymentProvider,
} from '../../../generated/prisma/client';

export class CreatePaymentDto {
  @IsInt()
  @IsPositive()
  amount!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentProvider)
  provider?: PaymentProvider;

  @IsString()
  @IsNotEmpty()
  reference!: string;

  @ValidateIf(
    (dto: CreatePaymentDto) => dto.method === PaymentMethod.MOBILE_MONEY,
  )
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'payerPhoneNumber must be a valid international phone number',
  })
  payerPhoneNumber?: string;
}
