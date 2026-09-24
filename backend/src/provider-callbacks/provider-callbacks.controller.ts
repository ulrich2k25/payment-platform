import {
  Body,
  Controller,
  Headers,
  Post,
} from '@nestjs/common';
import { FapshiProviderCallbackDto } from './dto/fapshi-provider-callback.dto';
import { SandboxProviderCallbackDto } from './dto/sandbox-provider-callback.dto';
import { ProviderCallbacksService } from './provider-callbacks.service';

@Controller('provider-callbacks')
export class ProviderCallbacksController {
  constructor(
    private readonly providerCallbacksService: ProviderCallbacksService,
  ) {}

  @Post('sandbox')
  handleSandboxCallback(
    @Headers('x-sandbox-callback-secret')
    callbackSecret: string | undefined,
    @Body() body: SandboxProviderCallbackDto,
  ) {
    return this.providerCallbacksService.handleSandboxCallback(
      callbackSecret,
      body,
    );
  }

  @Post('fapshi')
  handleFapshiCallback(
    @Headers('x-wh-secret')
    webhookSecret: string | undefined,
    @Body() body: FapshiProviderCallbackDto,
  ) {
    return this.providerCallbacksService.handleFapshiCallback(
      webhookSecret,
      body,
    );
  }
}