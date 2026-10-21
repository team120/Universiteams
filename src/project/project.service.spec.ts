import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Favorite } from '../favorite/favorite.entity';
import { CURRENT_DATE_SERVICE } from '../utils/current-date';
import { CurrentDateServiceMock } from '../utils/current-date.mock';
import {
  BadRequest,
  DbException,
  NotFound,
} from '../utils/exceptions/exceptions';
import { SerializationModule } from '../utils/serialization/serialization.module';
import { Project } from './project.entity';
import { QueryCreator } from './project.query.creator';
import { ProjectService } from './project.service';
import {
  Enrollment,
  ProjectRole,
  RequestState,
} from '../enrollment/enrollment.entity';
import { User } from '../user/user.entity';
import { ResearchDepartment } from '../research-department/department.entity';
import { Interest } from '../interest/interest.entity';
import { getQueueToken } from '@nestjs/bull';
import { emailQueueProcessor } from '../email/email.processor';

describe('ProjectService', () => {
  let service: ProjectService;
  const getOneMock = { getOne: jest.fn() };
  const queryCreatorMock = {
    findOne: jest.fn().mockReturnValue(getOneMock),
  };
  const currentDateServiceMock = new CurrentDateServiceMock('2022-01-01');
  // Transaction manager used by the enrollment state changes
  const managerMock = {
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    increment: jest.fn(),
    decrement: jest.fn(),
  };
  const projectRepositoryMock = {
    findOne: jest.fn(),
    manager: {
      transaction: jest.fn((work: (manager: unknown) => unknown) =>
        work(managerMock),
      ),
    },
  };
  // isUserAdmin finds an admin enrollment through a query builder
  const adminQueryBuilderMock = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };
  const enrollmentRepositoryMock = {
    createQueryBuilder: jest.fn(() => adminQueryBuilderMock),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: getRepositoryToken(Project),
          useValue: projectRepositoryMock,
        },
        {
          provide: getRepositoryToken(Favorite),
          useValue: {},
        },
        {
          provide: getRepositoryToken(User),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Enrollment),
          useValue: enrollmentRepositoryMock,
        },
        {
          provide: getRepositoryToken(ResearchDepartment),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Interest),
          useValue: {},
        },
        {
          provide: getQueueToken(emailQueueProcessor),
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
    Object.values(managerMock).forEach((mock) => mock.mockReset());
    projectRepositoryMock.findOne.mockReset();
    adminQueryBuilderMock.getOne.mockReset();
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
          expect(error.response).toBe('El ID no coincide con ningún proyecto');
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
          expect(error.response).toBe(
            'Ocurrió un error inesperado en el servidor',
          );
        });
        expect.assertions(2);
      });
    });
  });

  // A concurrent call already changed the enrollment: the conditional update
  // or delete matches no row, so no counter must change
  describe('when a concurrent call changes the enrollment first', () => {
    const currentUser = {
      id: 2,
      user: 'Camila Villa',
      email: 'user2@example.com',
      isEmailVerified: true,
      systemRole: 'admin',
    } as never;
    const pendingEnrollment = (senderId: number | null) => ({
      id: 10,
      requestState: RequestState.Pending,
      senderId,
    });
    const expectNoCounterChange = () => {
      expect(managerMock.increment).not.toHaveBeenCalled();
      expect(managerMock.decrement).not.toHaveBeenCalled();
    };

    beforeEach(() => {
      projectRepositoryMock.findOne.mockResolvedValue({ id: 1 });
      adminQueryBuilderMock.getOne.mockResolvedValue({ id: 99 });
      managerMock.update.mockResolvedValue({ affected: 0 });
      managerMock.delete.mockResolvedValue({ affected: 0 });
    });

    it('should not count an approved request twice', async () => {
      managerMock.findOne.mockResolvedValue(pendingEnrollment(null));

      await expect(
        service.manageEnrollRequest(1, 8, currentUser, {}, 'approve'),
      ).rejects.toBeInstanceOf(BadRequest);
      expectNoCounterChange();
    });

    it('should not count an accepted invitation twice', async () => {
      managerMock.findOne.mockResolvedValue(pendingEnrollment(2));

      await expect(
        service.manageEnrollInvitation(1, currentUser, {}, 'accept'),
      ).rejects.toBeInstanceOf(BadRequest);
      expectNoCounterChange();
    });

    it('should not count a canceled invitation twice', async () => {
      managerMock.findOne.mockResolvedValue(pendingEnrollment(2));

      await expect(
        service.cancelEnrollInvitation(1, 8, currentUser),
      ).rejects.toBeInstanceOf(BadRequest);
      expectNoCounterChange();
    });

    it('should not count a canceled request twice', async () => {
      managerMock.findOne.mockResolvedValue(pendingEnrollment(null));

      await expect(
        service.cancelEnrollRequest(1, currentUser),
      ).rejects.toBeInstanceOf(BadRequest);
      expectNoCounterChange();
    });

    it('should not count a kick twice', async () => {
      managerMock.findOne.mockResolvedValue({
        id: 10,
        requestState: RequestState.Accepted,
        senderId: null,
      });

      await expect(
        service.kickUser(1, 8, currentUser, {}),
      ).rejects.toBeInstanceOf(BadRequest);
      expectNoCounterChange();
    });

    it('should not count an unenrollment twice', async () => {
      managerMock.findOne.mockResolvedValue({
        id: 10,
        requestState: RequestState.Accepted,
        senderId: null,
      });

      await expect(service.unenroll(1, currentUser, {})).rejects.toBeInstanceOf(
        BadRequest,
      );
      expectNoCounterChange();
    });
  });

  describe('when creating an enrollment for a user', () => {
    it('should lock the invited user so concurrent invitations run one at a time', async () => {
      const currentUser = { id: 2 } as never;
      projectRepositoryMock.findOne.mockResolvedValue({ id: 1, name: 'P' });
      adminQueryBuilderMock.getOne.mockResolvedValue({ id: 99 });
      managerMock.findOne.mockResolvedValue(null);

      await service
        .createEnrollInvitation(1, 8, currentUser, {})
        .catch(() => undefined);

      expect(managerMock.findOne).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          where: { id: 8 },
          lock: { mode: 'pessimistic_write' },
        }),
      );
    });

    it('should only accept admins whose enrollment is accepted', async () => {
      projectRepositoryMock.findOne.mockResolvedValue({ id: 1, name: 'P' });
      adminQueryBuilderMock.getOne.mockResolvedValue(null);

      await service
        .createEnrollInvitation(1, 8, { id: 2 } as never, {})
        .catch(() => undefined);

      expect(adminQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'enrollment.role IN (:...roles)',
        { roles: [ProjectRole.Admin, ProjectRole.Leader] },
      );
      expect(adminQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'enrollment.requestState = :acceptedState',
        { acceptedState: RequestState.Accepted },
      );
    });
  });
});
