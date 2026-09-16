import { Module } from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { SandboxProvider } from './sandbox/sandbox.provider';

@Module({
  providers: [SandboxProvider, ProvidersService],
  exports: [SandboxProvider, ProvidersService],
})
export class ProvidersModule {}
