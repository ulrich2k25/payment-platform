import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authorization = request.headers.authorization;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing API key');
    }

    const apiKey = authorization.replace('Bearer ', '').trim();

    const keyHash = createHash('sha256').update(apiKey).digest('hex');

    const storedKey = await this.prisma.apiKey.findUnique({
      where: {
        keyHash,
      },
      include: {
        merchant: true,
      },
    });

    if (!storedKey) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (storedKey.status !== 'ACTIVE') {
      throw new UnauthorizedException('API key is revoked');
    }

    if (storedKey.merchant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Merchant account is not active');
    }

    await this.prisma.apiKey.update({
      where: {
        id: storedKey.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    request.merchant = storedKey.merchant;

    return true;
  }
}
