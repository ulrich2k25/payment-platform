import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentProvider as PaymentProviderType } from '../../generated/prisma/client';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { SandboxProvider } from './sandbox/sandbox.provider';

@Injectable()
export class ProvidersService {
  constructor(private readonly sandboxProvider: SandboxProvider) {}

  getProvider(provider: PaymentProviderType): PaymentProvider {
    switch (provider) {
      case PaymentProviderType.SANDBOX:
        return this.sandboxProvider;

      case PaymentProviderType.MTN_MOMO:
      case PaymentProviderType.ORANGE_MONEY:
      case PaymentProviderType.STELLAR:
        throw new BadRequestException(
          `Provider ${provider} is not implemented yet`,
        );

      default:
        throw new BadRequestException(
          `Unsupported payment provider: ${provider}`,
        );
    }
  }
}
