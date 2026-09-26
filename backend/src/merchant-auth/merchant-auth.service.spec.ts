import { ConflictException, UnauthorizedException } from '@nestjs/common';

import {
  MerchantStatus,
  MerchantUserRole,
  MerchantUserStatus,
} from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MerchantAuthService } from './merchant-auth.service';

describe('MerchantAuthService', () => {
  let service: MerchantAuthService;
  let prisma: any;

  const now = new Date();

  beforeEach(() => {
    prisma = {
      merchant: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },

      merchantUser: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },

      merchantSession: {
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

    service = new MerchantAuthService(prisma as PrismaService);
  });

  it('creates a merchant, owner and session on signup', async () => {
    prisma.merchant.findUnique.mockResolvedValue(null);

    prisma.merchantUser.findUnique.mockResolvedValue(null);

    prisma.merchant.create.mockImplementation(async ({ data }: any) => ({
      id: 'merchant-1',
      ...data,
      webhookUrl: null,
      webhookSecret: null,
      createdAt: now,
      updatedAt: now,
    }));

    prisma.merchantUser.create.mockImplementation(async ({ data }: any) => ({
      id: 'user-1',
      ...data,
      createdAt: now,
      updatedAt: now,
    }));

    prisma.merchantSession.create.mockImplementation(async ({ data }: any) => ({
      id: 'session-1',
      ...data,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    }));

    const result = await service.signup({
      companyName: 'Example Shop',
      email: 'owner@example.com',
      password: 'A-secure-password-123!',
    });

    expect(prisma.merchant.create).toHaveBeenCalledWith({
      data: {
        name: 'Example Shop',
        email: 'owner@example.com',
        status: MerchantStatus.ACTIVE,
      },
    });

    const userCreateCall = prisma.merchantUser.create.mock.calls[0][0];

    expect(userCreateCall.data.role).toBe(MerchantUserRole.OWNER);

    expect(userCreateCall.data.status).toBe(MerchantUserStatus.ACTIVE);

    expect(userCreateCall.data.passwordHash).not.toBe('A-secure-password-123!');

    expect(userCreateCall.data.passwordHash).toMatch(/^scrypt\$/);

    const sessionCreateCall = prisma.merchantSession.create.mock.calls[0][0];

    expect(sessionCreateCall.data.tokenHash).not.toBe(result.sessionToken);

    expect(sessionCreateCall.data.tokenHash).toMatch(/^[a-f0-9]{64}$/);

    expect(result.user.role).toBe(MerchantUserRole.OWNER);

    expect(result.merchant.name).toBe('Example Shop');
  });

  it('rejects signup when the email already exists', async () => {
    prisma.merchantUser.findUnique.mockResolvedValue({
      id: 'existing-user',
    });

    prisma.merchant.findUnique.mockResolvedValue(null);

    await expect(
      service.signup({
        companyName: 'Example Shop',
        email: 'owner@example.com',
        password: 'A-secure-password-123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(prisma.merchant.create).not.toHaveBeenCalled();
  });

  it('logs in an active merchant user', async () => {
    prisma.merchant.findUnique.mockResolvedValue(null);

    prisma.merchantUser.findUnique.mockResolvedValueOnce(null);

    prisma.merchant.create.mockImplementation(async ({ data }: any) => ({
      id: 'merchant-1',
      ...data,
      createdAt: now,
      updatedAt: now,
    }));

    prisma.merchantUser.create.mockImplementation(async ({ data }: any) => ({
      id: 'user-1',
      ...data,
      createdAt: now,
      updatedAt: now,
    }));

    prisma.merchantSession.create.mockImplementation(async ({ data }: any) => ({
      id: 'session-1',
      ...data,
      revokedAt: null,
      createdAt: now,
      updatedAt: now,
    }));

    await service.signup({
      companyName: 'Example Shop',
      email: 'owner@example.com',
      password: 'A-secure-password-123!',
    });

    const passwordHash =
      prisma.merchantUser.create.mock.calls[0][0].data.passwordHash;

    prisma.merchantUser.findUnique.mockResolvedValue({
      id: 'user-1',
      merchantId: 'merchant-1',
      email: 'owner@example.com',
      passwordHash,
      role: MerchantUserRole.OWNER,
      status: MerchantUserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,

      merchant: {
        id: 'merchant-1',
        name: 'Example Shop',
        email: 'owner@example.com',
        status: MerchantStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
    });

    prisma.merchantUser.update.mockResolvedValue({});

    const result = await service.login({
      email: 'owner@example.com',
      password: 'A-secure-password-123!',
    });

    expect(result.sessionToken).toEqual(expect.any(String));

    expect(result.user.role).toBe(MerchantUserRole.OWNER);

    expect(result.merchant.id).toBe('merchant-1');
  });

  it('rejects an invalid password', async () => {
    prisma.merchantUser.findUnique.mockResolvedValue({
      id: 'user-1',
      merchantId: 'merchant-1',
      email: 'owner@example.com',
      passwordHash: 'scrypt$invalid$invalid',
      role: MerchantUserRole.OWNER,
      status: MerchantUserStatus.ACTIVE,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,

      merchant: {
        id: 'merchant-1',
        name: 'Example Shop',
        email: 'owner@example.com',
        status: MerchantStatus.ACTIVE,
        createdAt: now,
        updatedAt: now,
      },
    });

    await expect(
      service.login({
        email: 'owner@example.com',
        password: 'Wrong-password-123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects login when the merchant is suspended', async () => {
    prisma.merchantUser.findUnique.mockResolvedValue({
      id: 'user-1',
      status: MerchantUserStatus.ACTIVE,

      merchant: {
        status: MerchantStatus.SUSPENDED,
      },
    });

    await expect(
      service.login({
        email: 'owner@example.com',
        password: 'A-secure-password-123!',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('validates an active merchant session', async () => {
    prisma.merchantSession.findUnique.mockResolvedValue({
      id: 'session-1',
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,

      merchantUser: {
        id: 'user-1',
        merchantId: 'merchant-1',
        email: 'owner@example.com',
        role: MerchantUserRole.OWNER,
        status: MerchantUserStatus.ACTIVE,
        lastLoginAt: now,
        createdAt: now,
        updatedAt: now,

        merchant: {
          id: 'merchant-1',
          name: 'Example Shop',
          email: 'owner@example.com',
          status: MerchantStatus.ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
      },
    });

    prisma.merchantSession.update.mockResolvedValue({});

    const result = await service.validateSession('raw-session-token');

    expect(result.sessionId).toBe('session-1');

    expect(result.user.email).toBe('owner@example.com');

    expect(result.merchant.id).toBe('merchant-1');
  });

  it('rejects an expired merchant session', async () => {
    prisma.merchantSession.findUnique.mockResolvedValue({
      id: 'session-1',
      expiresAt: new Date(Date.now() - 60_000),
      revokedAt: null,

      merchantUser: {
        status: MerchantUserStatus.ACTIVE,

        merchant: {
          status: MerchantStatus.ACTIVE,
        },
      },
    });

    await expect(
      service.validateSession('expired-token'),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('revokes the merchant session on logout', async () => {
    prisma.merchantSession.updateMany.mockResolvedValue({
      count: 1,
    });

    const result = await service.logoutSession('session-1');

    expect(prisma.merchantSession.updateMany).toHaveBeenCalledWith({
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
