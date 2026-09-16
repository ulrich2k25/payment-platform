import { Module } from '@nestjs/common';
import { MtnMomoProvider } from './mtn-momo/mtn-momo.provider';
import { ProvidersService } from './providers.service';
import { SandboxProvider } from './sandbox/sandbox.provider';

@Module({
  providers: [SandboxProvider, MtnMomoProvider, ProvidersService],
  exports: [SandboxProvider, MtnMomoProvider, ProvidersService],
})
export class ProvidersModule {}
