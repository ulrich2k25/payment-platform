jest.mock('@nestjs/config', () => ({
  ConfigService: class ConfigService {},
}));

import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

describe('PaymentsController', () => {
  let controller: PaymentsController;

  beforeEach(() => {
    const paymentsService = {} as PaymentsService;

    controller = new PaymentsController(paymentsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});