import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { AdminApiKeyGuard } from './admin-api-key.guard';

describe('AdminApiKeyGuard', () => {
  let guard: AdminApiKeyGuard;

  const createContext = (adminKey?: string): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers: adminKey
            ? {
                'x-admin-key': adminKey,
              }
            : {},
        }),
      }),
    }) as ExecutionContext;

  beforeEach(() => {
    guard = new AdminApiKeyGuard();
    process.env.ADMIN_API_KEY = 'test-admin-key';
  });

  afterEach(() => {
    delete process.env.ADMIN_API_KEY;
  });

  it('allows a valid admin API key', () => {
    const context = createContext('test-admin-key');

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects an invalid admin API key', () => {
    const context = createContext('wrong-admin-key');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects a missing admin API key', () => {
    const context = createContext();

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });

  it('rejects requests when ADMIN_API_KEY is not configured', () => {
    delete process.env.ADMIN_API_KEY;

    const context = createContext('test-admin-key');

    expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
  });
});
