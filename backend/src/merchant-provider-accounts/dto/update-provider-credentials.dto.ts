import { IsObject } from 'class-validator';

export class UpdateProviderCredentialsDto {
  @IsObject()
  credentials!: Record<string, unknown>;
}
