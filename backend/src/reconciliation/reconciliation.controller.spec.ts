import { ReconciliationController } from './reconciliation.controller';
import { ReconciliationService } from './reconciliation.service';

describe('ReconciliationController', () => {
  let controller: ReconciliationController;

  beforeEach(() => {
    const reconciliationService = {} as ReconciliationService;

    controller = new ReconciliationController(reconciliationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
