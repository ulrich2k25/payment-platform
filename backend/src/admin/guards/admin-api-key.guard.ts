import { timingSafeEqual } from 'crypto';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class AdminApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const adminKey = request.headers['x-admin-key'];
    const expectedAdminKey = process.env.ADMIN_API_KEY;

    if (!expectedAdminKey) {
      throw new UnauthorizedException('Admin API key is not configured');
    }

    if (
      typeof adminKey !== 'string' ||
      !this.secureCompare(adminKey, expectedAdminKey)
    ) {
      throw new UnauthorizedException('Invalid admin API key');
    }

    return true;
  }

  private secureCompare(first: string, second: string): boolean {
    const firstBuffer = Buffer.from(first, 'utf8');
    const secondBuffer = Buffer.from(second, 'utf8');

    if (firstBuffer.length !== secondBuffer.length) {
      return false;
    }

    return timingSafeEqual(firstBuffer, secondBuffer);
  }
}
