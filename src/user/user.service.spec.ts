import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { RequestState } from '../enrollment/enrollment.entity';
import { DbException } from '../utils/exceptions/exceptions';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { User } from './user.entity';
import { UserService } from './user.service';
import { QueryCreator } from './user.query.creator';

describe('UserService', () => {
  let service: UserService;
  const getOneMock = { getOne: jest.fn() };
  const queryCreatorMock = {
    findOne: jest.fn().mockReturnValue(getOneMock),
  };
  const userRepositoryMock = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [SerializationModule],
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: PinoLogger,
          useValue: { debug: jest.fn(), setContext: jest.fn() },
        },
        {
          provide: QueryCreator,
          useValue: queryCreatorMock,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    userRepositoryMock.find.mockReset();
    userRepositoryMock.findOne.mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('find all method', () => {
    describe('when find returns an empty array', () => {
      it('should return an empty array', async () => {
        userRepositoryMock.find.mockResolvedValue([]);
        const users = await service.findAll();
        expect(users).toEqual([]);
        expect(userRepositoryMock.find).toHaveBeenCalledTimes(1);
      });
    });

    describe('when an exception is thrown by the repository method', () => {
      it('should throw a db exception', async () => {
        userRepositoryMock.find.mockRejectedValue(new Error());
        await service.findAll().catch((error) => {
          expect(error).toBeInstanceOf(DbException);
          expect(error.response).toBe(
            'Ocurrió un error inesperado en el servidor',
          );
        });
        expect(userRepositoryMock.find).toHaveBeenCalledTimes(1);
        expect.assertions(3);
      });
    });
  });

  describe('find one method', () => {
    describe('when the user has enrollments in several states', () => {
      it('should return only the accepted enrollments', async () => {
        userRepositoryMock.findOne.mockResolvedValue({
          id: 8,
          enrollments: Object.values(RequestState).map((requestState, i) => ({
            id: i + 1,
            requestState,
            project: { id: i + 1 },
          })),
        });

        const user = await service.findOne(8);

        expect(user.enrollments).toHaveLength(1);
        expect(user.enrollments[0].project.id).toBe(
          Object.values(RequestState).indexOf(RequestState.Accepted) + 1,
        );
      });
    });

    describe('when the project of an accepted enrollment was deleted', () => {
      it('should not return the enrollment', async () => {
        userRepositoryMock.findOne.mockResolvedValue({
          id: 8,
          enrollments: [
            { id: 1, requestState: RequestState.Accepted, project: null },
          ],
        });

        const user = await service.findOne(8);

        expect(user.enrollments).toHaveLength(0);
      });
    });
  });
});
