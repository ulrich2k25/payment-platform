import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateMerchantDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsEmail()
  @MaxLength(255)
  email!: string;
}
