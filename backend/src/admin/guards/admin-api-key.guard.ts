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

    if (!adminKey || adminKey !== expectedAdminKey) {
      throw new UnauthorizedException('Invalid admin API key');
    }

    return true;
  }
}
