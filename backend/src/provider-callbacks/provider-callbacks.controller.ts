import { Body, Controller, Headers, Post } from '@nestjs/common';
import { SandboxProviderCallbackDto } from './dto/sandbox-provider-callback.dto';
import { ProviderCallbacksService } from './provider-callbacks.service';

@Controller('provider-callbacks')
export class ProviderCallbacksController {
  constructor(
    private readonly providerCallbacksService: ProviderCallbacksService,
  ) {}

  @Post('sandbox')
  handleSandboxCallback(
    @Headers('x-sandbox-callback-secret') callbackSecret: string | undefined,
    @Body() body: SandboxProviderCallbackDto,
  ) {
    return this.providerCallbacksService.handleSandboxCallback(
      callbackSecret,
      body,
    );
  }
}
