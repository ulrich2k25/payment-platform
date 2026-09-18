import { PrismaService } from '../prisma/prisma.service';
import { ApiKeysService } from './api-keys.service';

describe('ApiKeysService', () => {
  let service: ApiKeysService;

  beforeEach(() => {
    const prisma = {} as PrismaService;

    service = new ApiKeysService(prisma);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
