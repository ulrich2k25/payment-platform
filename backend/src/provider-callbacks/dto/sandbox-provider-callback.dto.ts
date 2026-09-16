import { IsIn, IsNotEmpty, IsString } from 'class-validator';

export class SandboxProviderCallbackDto {
  @IsString()
  @IsNotEmpty()
  providerReference!: string;

  @IsIn(['COMPLETED', 'FAILED'])
  status!: 'COMPLETED' | 'FAILED';
}
