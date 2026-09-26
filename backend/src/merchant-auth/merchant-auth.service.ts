import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'crypto';
import { promisify } from 'util';

import {
  MerchantStatus,
  MerchantUserRole,
  MerchantUserStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MerchantLoginDto } from './dto/merchant-login.dto';
import { MerchantSignupDto } from './dto/merchant-signup.dto';

const scrypt = promisify(scryptCallback);

type PublicMerchant = {
  id: string;
  name: string;
  email: string;
  status: MerchantStatus;
  createdAt: Date;
  updatedAt: Date;
};

type PublicMerchantUser = {
  id: string;
  merchantId: string;
  email: string;
  role: MerchantUserRole;
  status: MerchantUserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class MerchantAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async signup(dto: MerchantSignupDto) {
    const [existingUser, existingMerchant] = await Promise.all([
      this.prisma.merchantUser.findUnique({
        where: {
          email: dto.email,
        },
      }),

      this.prisma.merchant.findUnique({
        where: {
          email: dto.email,
        },
      }),
    ]);

    if (existingUser || existingMerchant) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const sessionToken = randomBytes(32).toString('base64url');

    const tokenHash = this.hashSessionToken(sessionToken);

    const now = new Date();

    const expiresAt = new Date(now.getTime() + this.getSessionTtlMs());

    const result = await this.prisma.$transaction(async (tx) => {
      const merchant = await tx.merchant.create({
        data: {
          name: dto.companyName,
          email: dto.email,
          status: MerchantStatus.ACTIVE,
        },
      });

      const user = await tx.merchantUser.create({
        data: {
          merchantId: merchant.id,
          email: dto.email,
          passwordHash,
          role: MerchantUserRole.OWNER,
          status: MerchantUserStatus.ACTIVE,
          lastLoginAt: now,
        },
      });

      const session = await tx.merchantSession.create({
        data: {
          merchantUserId: user.id,
          tokenHash,
          expiresAt,
          lastUsedAt: now,
        },
      });

      return {
        merchant,
        user,
        session,
      };
    });

    return {
      sessionToken,
      expiresAt: result.session.expiresAt,
      merchant: this.toPublicMerchant(result.merchant),
      user: this.toPublicUser(result.user),
    };
  }

  async login(dto: MerchantLoginDto) {
    const user = await this.prisma.merchantUser.findUnique({
      where: {
        email: dto.email,
      },
      include: {
        merchant: true,
      },
    });

    if (
      !user ||
      user.status !== MerchantUserStatus.ACTIVE ||
      user.merchant.status !== MerchantStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const validPassword = await this.verifyPassword(
      dto.password,
      user.passwordHash,
    );

    if (!validPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionToken = randomBytes(32).toString('base64url');

    const tokenHash = this.hashSessionToken(sessionToken);

    const now = new Date();

    const expiresAt = new Date(now.getTime() + this.getSessionTtlMs());

    const session = await this.prisma.$transaction(async (tx) => {
      const createdSession = await tx.merchantSession.create({
        data: {
          merchantUserId: user.id,
          tokenHash,
          expiresAt,
          lastUsedAt: now,
        },
      });

      await tx.merchantUser.update({
        where: {
          id: user.id,
        },
        data: {
          lastLoginAt: now,
        },
      });

      return createdSession;
    });

    return {
      sessionToken,
      expiresAt: session.expiresAt,
      merchant: this.toPublicMerchant(user.merchant),
      user: {
        ...this.toPublicUser(user),
        lastLoginAt: now,
      },
    };
  }

  async validateSession(sessionToken: string) {
    if (!sessionToken) {
      throw new UnauthorizedException('Invalid merchant session');
    }

    const tokenHash = this.hashSessionToken(sessionToken);

    const session = await this.prisma.merchantSession.findUnique({
      where: {
        tokenHash,
      },
      include: {
        merchantUser: {
          include: {
            merchant: true,
          },
        },
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      session.merchantUser.status !== MerchantUserStatus.ACTIVE ||
      session.merchantUser.merchant.status !== MerchantStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Invalid or expired merchant session');
    }

    await this.prisma.merchantSession.update({
      where: {
        id: session.id,
      },
      data: {
        lastUsedAt: new Date(),
      },
    });

    return {
      sessionId: session.id,

      user: this.toPublicUser(session.merchantUser),

      merchant: this.toPublicMerchant(session.merchantUser.merchant),
    };
  }

  async logoutSession(sessionId: string) {
    await this.prisma.merchantSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    return {
      success: true,
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16);

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;

    return [
      'scrypt',
      salt.toString('base64url'),
      derivedKey.toString('base64url'),
    ].join('$');
  }

  private async verifyPassword(
    password: string,
    storedHash: string,
  ): Promise<boolean> {
    try {
      const [algorithm, saltEncoded, hashEncoded] = storedHash.split('$');

      if (algorithm !== 'scrypt' || !saltEncoded || !hashEncoded) {
        return false;
      }

      const salt = Buffer.from(saltEncoded, 'base64url');

      const expectedHash = Buffer.from(hashEncoded, 'base64url');

      if (expectedHash.length === 0) {
        return false;
      }

      const actualHash = (await scrypt(
        password,
        salt,
        expectedHash.length,
      )) as Buffer;

      if (actualHash.length !== expectedHash.length) {
        return false;
      }

      return timingSafeEqual(actualHash, expectedHash);
    } catch {
      return false;
    }
  }

  private hashSessionToken(sessionToken: string): string {
    return createHash('sha256').update(sessionToken).digest('hex');
  }

  private getSessionTtlMs(): number {
    const configuredHours = Number(
      process.env.MERCHANT_SESSION_TTL_HOURS ?? 168,
    );

    const hours =
      Number.isFinite(configuredHours) && configuredHours > 0
        ? Math.min(configuredHours, 720)
        : 168;

    return hours * 60 * 60 * 1000;
  }

  private toPublicMerchant(merchant: {
    id: string;
    name: string;
    email: string;
    status: MerchantStatus;
    createdAt: Date;
    updatedAt: Date;
  }): PublicMerchant {
    return {
      id: merchant.id,
      name: merchant.name,
      email: merchant.email,
      status: merchant.status,
      createdAt: merchant.createdAt,
      updatedAt: merchant.updatedAt,
    };
  }

  private toPublicUser(user: {
    id: string;
    merchantId: string;
    email: string;
    role: MerchantUserRole;
    status: MerchantUserStatus;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): PublicMerchantUser {
    return {
      id: user.id,
      merchantId: user.merchantId,
      email: user.email,
      role: user.role,
      status: user.status,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
