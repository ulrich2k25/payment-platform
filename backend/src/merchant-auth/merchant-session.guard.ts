import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { MerchantAuthService } from './merchant-auth.service';

@Injectable()
export class MerchantSessionGuard implements CanActivate {
  constructor(private readonly merchantAuthService: MerchantAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;

    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException('Merchant session is required');
    }

    const sessionToken = authorization.slice('Bearer '.length).trim();

    if (!sessionToken) {
      throw new UnauthorizedException('Merchant session is required');
    }

    const session =
      await this.merchantAuthService.validateSession(sessionToken);

    request.merchant = session.merchant;
    request.merchantUser = session.user;

    request.merchantSession = {
      id: session.sessionId,
    };

    return true;
  }
}
