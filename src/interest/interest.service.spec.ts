import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from '../utils/exceptions/exceptions';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { Interest } from './interest.entity';
import { InterestService } from './interest.service';

describe('InterestService', () => {
  let service: InterestService;
  const interestRepositoryMock = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SerializationModule],
      providers: [
        InterestService,
        {
          provide: getRepositoryToken(Interest),
          useValue: interestRepositoryMock,
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), setContext: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<InterestService>(InterestService);
  });

  afterEach(() => {
    interestRepositoryMock.find.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('find all method', () => {
    describe('when find returns an empty array', () => {
      it('should return an empty array', async () => {
        interestRepositoryMock.find.mockResolvedValue([]);
        const interests = await service.find({});
        expect(interests).toEqual([]);
        expect(interestRepositoryMock.find).toHaveBeenCalledTimes(1);
      });
    });

    describe('when an exception is thrown by the repository method', () => {
      it('should throw a db exception', async () => {
        interestRepositoryMock.find.mockRejectedValue(new Error());
        await service.find({}).catch((error) => {
          expect(error).toBeInstanceOf(DbException);
          expect(error.response).toBe('Internal Server Error');
        });
        expect(interestRepositoryMock.find).toHaveBeenCalledTimes(1);
        expect.assertions(3);
      });
    });
  });
});
