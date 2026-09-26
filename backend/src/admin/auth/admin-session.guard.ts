import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { AdminAuthService } from './admin-auth.service';

@Injectable()
export class AdminSessionGuard implements CanActivate {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;

    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    ) {
      throw new UnauthorizedException('Admin session is required');
    }

    const sessionToken = authorization.slice('Bearer '.length).trim();

    if (!sessionToken) {
      throw new UnauthorizedException('Admin session is required');
    }

    const session = await this.adminAuthService.validateSession(sessionToken);

    request.adminUser = session.adminUser;

    request.adminSession = {
      id: session.sessionId,
    };

    return true;
  }
}
