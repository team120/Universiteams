import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from '../utils/exceptions/database.exception';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { QueryCreator } from './project.query.creator';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  const queryCreatorMock = { findOne: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), setContext: jest.fn() },
        },
        {
          provide: QueryCreator,
          useValue: queryCreatorMock,
        },
      ],
      imports: [SerializationModule],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    queryCreatorMock.findOne.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    describe('when no project is found', () => {
      it('should throw a NotFound exception', async () => {
        const noMatchingId = 155;
        queryCreatorMock.findOne.mockResolvedValue(undefined);
        await service.findOne(noMatchingId).catch((error) => {
          expect(error).toBeInstanceOf(NotFoundException);
          expect(error.response.message).toBe('Not Found');
        });
        expect.assertions(2);
      });
    });

    describe('when an exception is thrown by repository method', () => {
      it('should re-trow a db exception', async () => {
        queryCreatorMock.findOne.mockRejectedValue(new Error());
        const anyId = 155;
        await service.findOne(anyId).catch((error) => {
          expect(error).toBeInstanceOf(DbException);
          expect(error.response).toBe('Internal Server Error');
        });
        expect.assertions(2);
      });
    });
  });
});
