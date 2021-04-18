import { Test, TestingModule } from '@nestjs/testing';
import { EntityMapperService } from './entity-mapper.service';

describe('EntityMapperService', () => {
  let service: EntityMapperService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EntityMapperService],
    }).compile();

    service = module.get<EntityMapperService>(EntityMapperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
