import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Favorite } from '../favorite/favorite.entity';
import { CURRENT_DATE_SERVICE } from '../utils/current-date';
import { CurrentDateServiceMock } from '../utils/current-date.mock';
import { DbException, NotFound } from '../utils/exceptions/exceptions';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { Project } from './project.entity';
import { QueryCreator } from './project.query.creator';
import { ProjectService } from './project.service';

describe('ProjectService', () => {
  let service: ProjectService;
  const getOneMock = { getOne: jest.fn() };
  const queryCreatorMock = {
    findOne: jest.fn().mockReturnValue(getOneMock),
  };
  const currentDateServiceMock = new CurrentDateServiceMock('2022-01-01');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Favorite),
          useValue: {},
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), setContext: jest.fn() },
        },
        {
          provide: QueryCreator,
          useValue: queryCreatorMock,
        },
        { provide: CURRENT_DATE_SERVICE, useValue: currentDateServiceMock },
      ],
      imports: [SerializationModule],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
  });

  afterEach(() => {
    getOneMock.getOne.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    describe('when no project is found', () => {
      it('should throw a NotFound exception', async () => {
        const noMatchingId = 155;
        getOneMock.getOne.mockResolvedValue(undefined);
        await service.findOne(noMatchingId).catch((error) => {
          expect(error).toBeInstanceOf(NotFound);
          expect(error.response).toBe('Id does not match with any project');
        });
        expect.assertions(2);
      });
    });

    describe('when an exception is thrown by repository method', () => {
      it('should re-trow a db exception', async () => {
        getOneMock.getOne.mockRejectedValue(new Error());
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
