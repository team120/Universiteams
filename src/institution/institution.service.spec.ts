import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from '../utils/exceptions/database.exception';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { Institution } from './institution.entity';
import { InstitutionService } from './institution.service';

describe('InstitutionService', () => {
  let service: InstitutionService;
  const institutionRepositoryMock = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SerializationModule],
      providers: [
        InstitutionService,
        {
          provide: getRepositoryToken(Institution),
          useValue: institutionRepositoryMock,
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), setContext: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<InstitutionService>(InstitutionService);
  });

  afterEach(() => {
    institutionRepositoryMock.find.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  describe('find all method', () => {
    describe('when find returns an empty array', () => {
      it('should return an empty array', async () => {
        institutionRepositoryMock.find.mockResolvedValue([]);
        const institutions = await service.findAll();
        expect(institutions).toEqual([]);
        expect(institutionRepositoryMock.find).toHaveBeenCalledTimes(1);
      });
    });

    describe('when an exception is thrown by the repository method', () => {
      it('should throw a db exception', async () => {
        institutionRepositoryMock.find.mockRejectedValue(new Error());
        await service.findAll().catch((error) => {
          expect(error).toBeInstanceOf(DbException);
          expect(error.response).toBe('Internal Server Error');
        });
        expect(institutionRepositoryMock.find).toHaveBeenCalledTimes(1);
        expect.assertions(3);
      });
    });
  });
});
