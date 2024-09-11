import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Repository } from 'typeorm';
import { UserShowDto, UsersResult } from './dtos/user.show.dto';
import { User, UserSystemRole } from './user.entity';
import {
  PaginationAttributes,
  UserFilters,
  UserFindDto,
  UserSortAttributes,
} from './dtos/user.find.dto';
import { QueryCreator } from './user.query.creator';
import {
  BadRequest,
  DbException,
  NotFound,
  Unauthorized,
} from '../utils/exceptions/exceptions';
import { CurrentUserWithoutTokens } from 'src/auth/dtos/current-user.dto';
import { EnrollmentRequestFromLeaderDto } from 'src/enrollment/dtos/enrollment.request.dto';
import {
  Enrollment,
  ProjectRole,
  RequestState,
} from 'src/enrollment/enrollment.entity';
import { Project } from 'src/project/project.entity';
import { projectNotFoundError } from 'src/project/project.service';
import { EnrollmentInvitationNotifyEmailData } from 'src/email/dtos/enrollment-request-email-data.dto';
import { InjectQueue } from '@nestjs/bull';
import {
  emailQueueProcessor,
  enrollmentRequestEmailJob,
} from 'src/email/email.processor';
import { Queue } from 'bull';
import {
  EnrollmentRequestShowDto,
  EnrollmentRequestsShowDto,
} from 'src/enrollment/dtos/enrollment-request.show.dto';

export const userNotFoundError = new NotFound(
  'El ID no coincide con ningún usuario',
);

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    @InjectQueue(emailQueueProcessor)
    private readonly emailQueue: Queue,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
    private readonly queryCreator: QueryCreator,
  ) {
    this.logger.setContext(UserService.name);
  }

  async findAll(): Promise<UserShowDto[]> {
    this.logger.debug('Find users and their relations');
    const users = await this.userRepository
      .find({
        relations: [
          'userAffiliations',
          'userAffiliations.researchDepartment',
          'userAffiliations.researchDepartment.facility',
          'userAffiliations.researchDepartment.facility.institution',
          'interests',
        ],
      })
      .catch((error: Error) => {
        throw new DbException(error.message, error.stack);
      });
    this.logger.debug('Map users to dto');
    return this.entityMapper.mapArray(UserShowDto, users, {
      groups: ['admin'],
    });
  }

  async find(findOptions: UserFindDto): Promise<UsersResult> {
    const filters: UserFilters = this.entityMapper.mapValue(
      UserFilters,
      findOptions,
    );
    const paginationAttributes: PaginationAttributes =
      this.entityMapper.mapValue(PaginationAttributes, findOptions);
    const sortAttributes: UserSortAttributes = this.entityMapper.mapValue(
      UserSortAttributes,
      findOptions,
    );

    const query = this.queryCreator.initialQuery();
    const queryWithFilters = this.queryCreator.applyFilters(filters, query);
    const usersCount = await queryWithFilters.getCount();
    const queryWithPagination = this.queryCreator.applyPaginations(
      queryWithFilters,
      paginationAttributes,
    );
    const queryWithProjections = this.queryCreator.applyProjectionsAndSorting(
      sortAttributes,
      queryWithPagination,
    );

    const users = await queryWithProjections.getMany().catch((err: Error) => {
      throw new DbException(err.message, err.stack);
    });

    return {
      users: this.entityMapper.mapArray(UserShowDto, users),
      usersCount: usersCount,
    };
  }

  async findOne(userId: number): Promise<UserShowDto> {
    this.logger.debug('Find a user by id and its relations');
    const user = await this.userRepository
      .findOne({
        relations: [
          'userAffiliations',
          'userAffiliations.researchDepartment',
          'userAffiliations.researchDepartment.facility',
          'userAffiliations.researchDepartment.facility.institution',
          'interests',
          'enrollments',
          'enrollments.project',
        ],
        where: { id: userId },
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    if (!user) throw new NotFound('Usuario no encontrado');
    if (user.systemRole === UserSystemRole.SUPER_ADMIN)
      throw new NotFound('Usuario no disponible');
    return this.entityMapper.mapValue(UserShowDto, user);
  }

  async promoteToAdmin(userId: number): Promise<UserShowDto> {
    this.logger.debug('Promote user to admin');
    const user = await this.userRepository
      .findOne({ where: { id: userId } })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    if (!user) throw new NotFound('Usuario no encontrado');
    // If user already has ADMIN role, return. Otherwise update user role
    if (user.systemRole === UserSystemRole.ADMIN)
      return this.entityMapper.mapValue(UserShowDto, user);
    user.systemRole = UserSystemRole.ADMIN;
    await this.userRepository.save(user).catch((e: Error) => {
      throw new DbException(e.message, e.stack);
    });
    return this.entityMapper.mapValue(UserShowDto, user);
  }

  async createEnrollInvitation(
    userId: number,
    currentUser: CurrentUserWithoutTokens,
    enrollmentRequest: EnrollmentRequestFromLeaderDto,
  ) {
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const isUserAdmin = await this.isUserAdmin(
        currentUser,
        enrollmentRequest.projectId,
      );
      if (!isUserAdmin) {
        throw new Unauthorized(
          'No tienes autorización para enviar invitaciones de inscripción a este proyecto',
        );
      }

      const userToInvite = await queryRunner.manager.findOne(User, {
        where: { id: userId },
        select: ['id', 'firstName', 'lastName'],
      });
      if (!userToInvite) throw userNotFoundError;

      const project = await queryRunner.manager.findOne(Project, {
        where: { id: enrollmentRequest.projectId },
        select: ['id', 'name', 'requestEnrollmentCount'],
      });
      if (!project) throw projectNotFoundError;

      const enrollment = await queryRunner.manager.findOne(Enrollment, {
        where: {
          project: {
            id: project.id,
          },
          user: {
            id: userToInvite.id,
          },
        },
      });
      switch (enrollment?.requestState) {
        case RequestState.Pending:
          if (enrollment.isLeaderToUserRequest) {
            throw new BadRequest(
              'Este usuario ya ha sido invitado para inscribirse en este proyecto',
            );
          }
          throw new BadRequest(
            'Este usuario ya ha solicitado la inscripción en este proyecto',
          );
        case RequestState.Accepted:
          throw new BadRequest(
            'Este usuario ya está inscripto en este proyecto',
          );
        default:
          break;
      }

      const pendingEnrollment = {
        project: {
          id: project.id,
        },
        user: {
          id: userToInvite.id,
        },
        requestState: RequestState.Pending,
        requesterMessage: enrollmentRequest.message,
        isLeaderToUserRequest: true,
      };
      await queryRunner.manager.upsert(Enrollment, pendingEnrollment, [
        'project',
        'user',
      ]);

      // Increase user enrollment invitations count
      await queryRunner.manager.update(User, userToInvite.id, {
        requestEnrollmentInvitationsCount:
          userToInvite.requestEnrollmentInvitationsCount + 1,
      });

      await queryRunner.commitTransaction();

      await this.emailQueue
        .add(enrollmentRequestEmailJob, {
          project: project,
          user: userToInvite,
        } as EnrollmentInvitationNotifyEmailData)
        .catch((err: Error) => {
          this.logger.error(err, err.message);
        });

      this.logger.debug(
        `User#${userToInvite.id} was successfully invited to enroll by user#${currentUser.id} from project#${project.id}`,
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw new DbException(err.message, err.stack);
    } finally {
      await queryRunner.release();
    }
  }

  // To-do: unify this duplicated method with the one in project service
  private async isUserAdmin(
    currentUser: CurrentUserWithoutTokens,
    projectId: number,
  ) {
    const currentUserEnrollment = await this.enrollmentRepository
      .createQueryBuilder('enrollment')
      .select('enrollment.id')
      .where('enrollment.userId = :userId', { userId: currentUser.id })
      .andWhere('enrollment.projectId = :projectId', { projectId })
      .andWhere('enrollment.role IN (:...roles)', {
        roles: [ProjectRole.Admin, ProjectRole.Leader],
      })
      .getOne();

    if (!currentUserEnrollment) return false;

    return true;
  }
}
