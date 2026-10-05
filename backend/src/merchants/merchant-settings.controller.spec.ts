import { ForbiddenException } from '@nestjs/common';

import { MerchantUserRole } from '../../generated/prisma/client';

import { MerchantSettingsController } from './merchant-settings.controller';
import { MerchantSettingsService } from './merchant-settings.service';

describe('MerchantSettingsController', () => {
  let controller: MerchantSettingsController;

  let merchantSettingsService: {
    updateProfile: jest.Mock;
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
    merchantSettingsService = {
      updateProfile: jest.fn(),
    };

    controller = new MerchantSettingsController(
      merchantSettingsService as unknown as MerchantSettingsService,
    );
  });

  it.each([MerchantUserRole.OWNER, MerchantUserRole.ADMIN])(
    'allows %s to update merchant settings',
    async (role) => {
      const dto = {
        name: 'Updated Merchant',
        email: 'merchant@example.com',
      };

      merchantSettingsService.updateProfile.mockResolvedValue({
        id: 'merchant-1',
        ...dto,
      });

      const result = await controller.updateProfile(createRequest(role), dto);

      expect(merchantSettingsService.updateProfile).toHaveBeenCalledWith(
        'merchant-1',
        dto,
      );

      expect(result).toEqual({
        id: 'merchant-1',
        ...dto,
      });
    },
  );

  it.each([MerchantUserRole.DEVELOPER, MerchantUserRole.VIEWER])(
    'rejects %s when updating merchant settings',
    (role) => {
      expect(() =>
        controller.updateProfile(createRequest(role), {
          name: 'Updated Merchant',
          email: 'merchant@example.com',
        }),
      ).toThrow(ForbiddenException);

      expect(merchantSettingsService.updateProfile).not.toHaveBeenCalled();
    },
  );
});
