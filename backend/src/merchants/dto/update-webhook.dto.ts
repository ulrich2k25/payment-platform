import { IsNotEmpty, IsUrl, MaxLength } from 'class-validator';

export class UpdateWebhookDto {
  @IsUrl({
    require_protocol: true,
  })
  @IsNotEmpty()
  @MaxLength(500)
  webhookUrl!: string;
}
