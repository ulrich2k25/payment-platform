import { Module } from '@nestjs/common';
import { FapshiProvider } from './fapshi/fapshi.provider';
import { MtnMomoProvider } from './mtn-momo/mtn-momo.provider';
import { ProvidersService } from './providers.service';
import { SandboxProvider } from './sandbox/sandbox.provider';

@Module({
  providers: [
    SandboxProvider,
    FapshiProvider,
    MtnMomoProvider,
    ProvidersService,
  ],
  exports: [
    SandboxProvider,
    FapshiProvider,
    MtnMomoProvider,
    ProvidersService,
  ],
})
export class ProvidersModule {}