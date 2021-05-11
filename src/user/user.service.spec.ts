import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from '../utils/exceptions/database.exception';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { User } from './user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  const userRepositoryMock = {
    find: jest.fn(),
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
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    userRepositoryMock.find.mockReset();
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
          expect(error.response).toBe('Internal Server Error');
        });
        expect(userRepositoryMock.find).toHaveBeenCalledTimes(1);
        expect.assertions(3);
      });
    });
  });
});
