import { Module } from '@nestjs/common';
import { ProviderCredentialsCryptoService } from './provider-credentials-crypto.service';

@Module({
  providers: [ProviderCredentialsCryptoService],
  exports: [ProviderCredentialsCryptoService],
})
export class SecurityModule {}
