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

import { AdminUserStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminCredentialsDto } from './dto/admin-credentials.dto';

const scrypt = promisify(scryptCallback);

type PublicAdminUser = {
  id: string;
  email: string;
  status: AdminUserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class AdminAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrapAdmin(dto: AdminCredentialsDto): Promise<PublicAdminUser> {
    const existingAdminCount = await this.prisma.adminUser.count();

    if (existingAdminCount > 0) {
      throw new ConflictException('An admin user already exists');
    }

    const passwordHash = await this.hashPassword(dto.password);

    const admin = await this.prisma.adminUser.create({
      data: {
        email: dto.email,
        passwordHash,
        status: AdminUserStatus.ACTIVE,
      },
    });

    return this.toPublicAdmin(admin);
  }

  async login(dto: AdminCredentialsDto) {
    const admin = await this.prisma.adminUser.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!admin || admin.status !== AdminUserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordValid = await this.verifyPassword(
      dto.password,
      admin.passwordHash,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const sessionToken = randomBytes(32).toString('base64url');

    const tokenHash = this.hashSessionToken(sessionToken);

    const now = new Date();

    const expiresAt = new Date(now.getTime() + this.getSessionTtlMs());

    const session = await this.prisma.$transaction(async (tx) => {
      const createdSession = await tx.adminSession.create({
        data: {
          adminUserId: admin.id,
          tokenHash,
          expiresAt,
          lastUsedAt: now,
        },
      });

      await tx.adminUser.update({
        where: {
          id: admin.id,
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
      admin: {
        ...this.toPublicAdmin(admin),
        lastLoginAt: now,
      },
    };
  }

  async validateSession(sessionToken: string) {
    if (!sessionToken) {
      throw new UnauthorizedException('Invalid admin session');
    }

    const tokenHash = this.hashSessionToken(sessionToken);

    const session = await this.prisma.adminSession.findUnique({
      where: {
        tokenHash,
      },
      include: {
        adminUser: true,
      },
    });

    if (
      !session ||
      session.revokedAt ||
      session.expiresAt.getTime() <= Date.now() ||
      session.adminUser.status !== AdminUserStatus.ACTIVE
    ) {
      throw new UnauthorizedException('Invalid or expired admin session');
    }

    const now = new Date();

    await this.prisma.adminSession.update({
      where: {
        id: session.id,
      },
      data: {
        lastUsedAt: now,
      },
    });

    return {
      sessionId: session.id,
      adminUser: this.toPublicAdmin(session.adminUser),
    };
  }

  async logoutSession(sessionId: string) {
    await this.prisma.adminSession.updateMany({
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
    const configuredHours = Number(process.env.ADMIN_SESSION_TTL_HOURS ?? 12);

    const hours =
      Number.isFinite(configuredHours) && configuredHours > 0
        ? Math.min(configuredHours, 168)
        : 12;

    return hours * 60 * 60 * 1000;
  }

  private toPublicAdmin(admin: {
    id: string;
    email: string;
    status: AdminUserStatus;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): PublicAdminUser {
    return {
      id: admin.id,
      email: admin.email,
      status: admin.status,
      lastLoginAt: admin.lastLoginAt,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
    };
  }
}
