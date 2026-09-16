import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsPositive,
  IsString,
  Length,
} from 'class-validator';
import { PaymentMethod } from '../../../generated/prisma/client';

export class CreatePaymentDto {
  @IsInt()
  @IsPositive()
  amount!: number;

  @IsString()
  @Length(3, 3)
  currency!: string;

  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @IsString()
  @IsNotEmpty()
  reference!: string;
}
