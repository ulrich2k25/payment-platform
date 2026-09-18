import { MerchantsController } from './merchants.controller';
import { MerchantsService } from './merchants.service';

describe('MerchantsController', () => {
  let controller: MerchantsController;

  beforeEach(() => {
    const merchantsService = {} as MerchantsService;

    controller = new MerchantsController(merchantsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
