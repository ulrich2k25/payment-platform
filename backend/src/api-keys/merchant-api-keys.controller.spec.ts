import { ForbiddenException } from '@nestjs/common';

import { MerchantUserRole } from '../../generated/prisma/client';

import { ApiKeysService } from './api-keys.service';
import { MerchantApiKeysController } from './merchant-api-keys.controller';

describe('MerchantApiKeysController', () => {
  let controller: MerchantApiKeysController;

  let apiKeysService: {
    createForMerchant: jest.Mock;
    findAllForMerchant: jest.Mock;
    revokeForMerchant: jest.Mock;
  };

  function createRequest(role: MerchantUserRole) {
    return {
      merchant: {
        id: 'merchant-1',
      },
      merchantUser: {
        role,
      },
    };
  }

  beforeEach(() => {
    apiKeysService = {
      createForMerchant: jest.fn(),
      findAllForMerchant: jest.fn(),
      revokeForMerchant: jest.fn(),
    };

    controller = new MerchantApiKeysController(
      apiKeysService as unknown as ApiKeysService,
    );
  });

  it.each([
    MerchantUserRole.OWNER,
    MerchantUserRole.ADMIN,
    MerchantUserRole.DEVELOPER,
  ])('allows %s to create an API key', async (role) => {
    apiKeysService.createForMerchant.mockResolvedValue({
      id: 'key-1',
      key: 'test-key',
    });

    const result = await controller.create(createRequest(role));

    expect(apiKeysService.createForMerchant).toHaveBeenCalledWith('merchant-1');

    expect(result).toEqual({
      id: 'key-1',
      key: 'test-key',
    });
  });

  it('rejects VIEWER when creating an API key', () => {
    expect(() =>
      controller.create(createRequest(MerchantUserRole.VIEWER)),
    ).toThrow(ForbiddenException);

    expect(apiKeysService.createForMerchant).not.toHaveBeenCalled();
  });

  it.each([
    MerchantUserRole.OWNER,
    MerchantUserRole.ADMIN,
    MerchantUserRole.DEVELOPER,
  ])('allows %s to revoke an API key', async (role) => {
    apiKeysService.revokeForMerchant.mockResolvedValue({
      id: 'key-1',
      status: 'REVOKED',
    });

    const result = await controller.revoke(createRequest(role), 'key-1');

    expect(apiKeysService.revokeForMerchant).toHaveBeenCalledWith(
      'merchant-1',
      'key-1',
    );

    expect(result).toEqual({
      id: 'key-1',
      status: 'REVOKED',
    });
  });

  it('rejects VIEWER when revoking an API key', () => {
    expect(() =>
      controller.revoke(createRequest(MerchantUserRole.VIEWER), 'key-1'),
    ).toThrow(ForbiddenException);

    expect(apiKeysService.revokeForMerchant).not.toHaveBeenCalled();
  });

  it.each([
    MerchantUserRole.OWNER,
    MerchantUserRole.ADMIN,
    MerchantUserRole.DEVELOPER,
    MerchantUserRole.VIEWER,
  ])('allows %s to list API keys', async (role) => {
    apiKeysService.findAllForMerchant.mockResolvedValue([]);

    const result = await controller.findAll(createRequest(role));

    expect(apiKeysService.findAllForMerchant).toHaveBeenCalledWith(
      'merchant-1',
    );

    expect(result).toEqual([]);
  });
});
