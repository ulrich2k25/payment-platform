jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { ConflictException, UnauthorizedException } from '@nestjs/common';

import { AdminUserStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AdminAuthService } from './admin-auth.service';

describe('AdminAuthService', () => {
  let service: AdminAuthService;
  let prisma: any;

  const now = new Date();

  beforeEach(() => {
    prisma = {
      adminUser: {
        count: jest.fn(),
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },

      adminSession: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },

      $transaction: jest.fn(),
    };

    prisma.$transaction.mockImplementation(async (callback: any) =>
      callback(prisma),
    );

    service = new AdminAuthService(prisma as PrismaService);
  });

  it('bootstraps the first admin with a hashed password', async () => {
    prisma.adminUser.count.mockResolvedValue(0);

    prisma.adminUser.create.mockImplementation(async ({ data }: any) => ({
      id: 'admin-1',
      ...data,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await service.bootstrapAdmin({
      email: 'admin@example.com',
      password: 'A-very-secure-password-123!',
    });

    const createCall = prisma.adminUser.create.mock.calls[0][0];

    expect(createCall.data.passwordHash).not.toBe(
      'A-very-secure-password-123!',
    );

    expect(createCall.data.passwordHash).toMatch(/^scrypt\$/);

    expect(result).toEqual({
      id: 'admin-1',
      email: 'admin@example.com',
      status: AdminUserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    expect((result as any).passwordHash).toBeUndefined();
  });

  it('rejects bootstrap when an admin already exists', async () => {
    prisma.adminUser.count.mockResolvedValue(1);

    await expect(
      service.bootstrapAdmin({
        email: 'admin@example.com',
        password: 'A-very-secure-password-123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.adminUser.create).not.toHaveBeenCalled();
  });

  it('logs in an active admin and stores only the session token hash', async () => {
    prisma.adminUser.count.mockResolvedValue(0);

    prisma.adminUser.create.mockImplementation(async ({ data }: any) => ({
      id: 'admin-1',
      ...data,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    }));

    await service.bootstrapAdmin({
      email: 'admin@example.com',
      password: 'A-very-secure-password-123!',
    });

    const passwordHash =
      prisma.adminUser.create.mock.calls[0][0].data.passwordHash;

    prisma.adminUser.findUnique.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      passwordHash,
      status: AdminUserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    prisma.adminSession.create.mockImplementation(async ({ data }: any) => ({
      id: 'session-1',
      ...data,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    }));

    prisma.adminUser.update.mockResolvedValue({});

    const result = await service.login({
      email: 'admin@example.com',
      password: 'A-very-secure-password-123!',
    });

    expect(result.sessionToken).toEqual(expect.any(String));

    expect(result.sessionToken.length).toBeGreaterThan(20);

    const sessionCreateCall = prisma.adminSession.create.mock.calls[0][0];

    expect(sessionCreateCall.data.tokenHash).not.toBe(result.sessionToken);

    expect(sessionCreateCall.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);

    expect(sessionCreateCall.data.adminUserId).toBe('admin-1');
  });

  it('rejects an invalid password', async () => {
    prisma.adminUser.findUnique.mockResolvedValue({
      id: 'admin-1',
      email: 'admin@example.com',
      passwordHash: 'scrypt$invalid$invalid',
      status: AdminUserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });

    await expect(
      service.login({
        email: 'admin@example.com',
        password: 'Wrong-password-123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.adminSession.create).not.toHaveBeenCalled();
  });

  it('validates an active session', async () => {
    prisma.adminSession.findUnique.mockResolvedValue({
      id: 'session-1',
      adminUserId: 'admin-1',
      tokenHash: 'stored-hash',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
      lastUsedAt: null,
      createdAt: now,
      updatedAt: now,

      adminUser: {
        id: 'admin-1',
        email: 'admin@example.com',
        passwordHash: 'hidden',
        status: AdminUserStatus.ACTIVE,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });

    prisma.adminSession.update.mockResolvedValue({});

    const result = await service.validateSession('raw-session-token');

    expect(result.sessionId).toBe('session-1');

    expect(result.adminUser.email).toBe('admin@example.com');

    expect((result.adminUser as any).passwordHash).toBeUndefined();

    expect(prisma.adminSession.update).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
      },
      data: {
        lastUsedAt: expect.any(Date),
      },
    });
  });

  it('rejects an expired session', async () => {
    prisma.adminSession.findUnique.mockResolvedValue({
      id: 'session-1',
      expiresAt: new Date(Date.now() - 60_000),
      revokedAt: null,

      adminUser: {
        status: AdminUserStatus.ACTIVE,
      },
    });

    await expect(
      service.validateSession('expired-session-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.adminSession.update).not.toHaveBeenCalled();
  });

  it('revokes an admin session on logout', async () => {
    prisma.adminSession.updateMany.mockResolvedValue({
      count: 1,
    });

    const result = await service.logoutSession('session-1');

    expect(prisma.adminSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'session-1',
        revokedAt: null,
      },
      data: {
        revokedAt: expect.any(Date),
      },
    });

    expect(result).toEqual({
      success: true,
    });
  });
});
