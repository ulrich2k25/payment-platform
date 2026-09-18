import { TransactionsController } from './transactions.controller';
import { TransactionsService } from './transactions.service';

describe('TransactionsController', () => {
  let controller: TransactionsController;

  beforeEach(() => {
    const transactionsService = {} as TransactionsService;

    controller = new TransactionsController(transactionsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
