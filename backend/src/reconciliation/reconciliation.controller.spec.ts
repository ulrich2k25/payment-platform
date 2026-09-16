import { Test, TestingModule } from '@nestjs/testing';
import { ReconciliationController } from './reconciliation.controller';

describe('ReconciliationController', () => {
  let controller: ReconciliationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReconciliationController],
    }).compile();

    controller = module.get<ReconciliationController>(ReconciliationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
