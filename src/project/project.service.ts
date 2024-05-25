import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { In, Repository } from 'typeorm';
import { CurrentUserWithoutTokens } from '../auth/dtos/current-user.dto';
import { Favorite } from '../favorite/favorite.entity';
import {
  BadRequest,
  DbException,
  NotFound,
  Unauthorized,
} from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import {
  ProjectFilters,
  ProjectFindDto,
  PaginationAttributes,
  ProjectSortAttributes,
} from './dtos/project.find.dto';
import {
  ProjectInListDto,
  ProjectSingleDto,
  ProjectsResult,
} from './dtos/project.show.dto';
import { Project } from './project.entity';
import { QueryCreator } from './project.query.creator';
import {
  Enrollment,
  ProjectRole,
  RequestState,
} from '../enrollment/enrollment.entity';
import { EnrollmentRequestDto } from '../enrollment/dtos/enrollment.request.dto';
import { UnenrollDto } from '../enrollment/dtos/unenroll.dto';
import {
  EnrollmentRequestShowDto,
  EnrollmentRequestsShowDto,
} from '../enrollment/dtos/enrollment-request.show.dto';
import { EnrollmentRequestRejectDto } from '../enrollment/dtos/enrollment-request-reject.dto';

const projectNotFoundError = new NotFound(
  'El ID no coincide con ningún proyecto',
);

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly queryCreator: QueryCreator,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProjectService.name);
  }

  async find(
    findOptions: ProjectFindDto,
    currentUser?: CurrentUserWithoutTokens,
  ): Promise<ProjectsResult> {
    const filters: ProjectFilters = this.entityMapper.mapValue(
      ProjectFilters,
      findOptions,
    );
    const sortAttributes: ProjectSortAttributes = this.entityMapper.mapValue(
      ProjectSortAttributes,
      findOptions,
    );
    const paginationAttributes = this.entityMapper.mapValue(
      PaginationAttributes,
      findOptions,
    );

    const query = this.queryCreator.initialProjectQuery();

    const searchQuery = this.queryCreator.applyTextSearch(filters, query);

    const [fuzzyTextSearchQuery, suggestedSearchTerms] =
      await this.queryCreator.applyFuzzyTextSearch(filters, searchQuery);

    const extraFiltersAppliedSearchQuery = this.queryCreator.applyExtraFilters(
      filters,
      fuzzyTextSearchQuery,
      currentUser,
    );

    const [sortingAppliedQuery, orderByClause] = this.queryCreator.applySorting(
      sortAttributes,
      extraFiltersAppliedSearchQuery,
    );

    const [paginationAppliedQuery, projectsCount] =
      await this.queryCreator.applyPaginationAndProjections(
        sortingAppliedQuery,
        paginationAttributes,
        orderByClause,
        currentUser,
      );

    this.logger.info(paginationAppliedQuery.getSql());

    const projects = await paginationAppliedQuery
      .getMany()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug('Map projects to dto');
    return {
      projects: this.entityMapper.mapArray(ProjectInListDto, projects),
      projectCount: projectsCount,
      suggestedSearchTerms: suggestedSearchTerms,
    };
  }

  async findOne(
    id: number,
    currentUser?: CurrentUserWithoutTokens,
  ): Promise<ProjectSingleDto> {
    this.logger.debug(
      'Find project with matching ids and their related department, users, user institution and department institution',
    );

    const project = await this.queryCreator
      .findOne(id, currentUser)
      .getOne()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug(`Project ${project?.id} found`);
    if (!project) throw new NotFound('El ID no coincide con ningún proyecto');

    this.logger.debug('Map project to dto');
    return this.entityMapper.mapValue(ProjectSingleDto, project);
  }

  async favorite(id: number, user: CurrentUserWithoutTokens) {
    const project = await this.projectRepository.findOne({ where: { id: id } });
    if (!project) throw new NotFound('El ID no coincide con ningún proyecto');

    const favorite = await this.favoriteRepository.findOne({
      where: {
        projectId: project.id,
        userId: user.id,
      },
    });
    if (favorite)
      throw new BadRequest(
        'This project has been already favorited by this user',
      );

    await this.favoriteRepository
      .insert({
        projectId: project.id,
        userId: user.id,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully favorite by user#${user.id}`,
    );

    await this.projectRepository
      .update(project.id, {
        favoriteCount: project.favoriteCount + 1,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully increased its favorite count`,
    );
  }

  async unfavorite(id: number, user: CurrentUserWithoutTokens) {
    const project = await this.projectRepository.findOne({ where: { id: id } });
    if (!project) throw new NotFound('El ID no coincide con ningún proyecto');

    const favorite = await this.favoriteRepository.findOne({
      where: {
        projectId: project.id,
        userId: user.id,
      },
    });
    if (!favorite)
      throw new BadRequest('This project has not been favorited by this user');

    await this.favoriteRepository
      .delete({
        projectId: project.id,
        userId: user.id,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully unfavorited by user#${user.id}`,
    );

    await this.projectRepository
      .update(project.id, {
        favoriteCount: project.favoriteCount - 1,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully decreased its favorite count`,
    );
  }

  async requestEnroll(
    projectId: number,
    user: CurrentUserWithoutTokens,
    enrollmentRequest: EnrollmentRequestDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'requestEnrollmentCount'],
    });
    if (!project) throw new NotFound('El ID no coincide con ningún proyecto');

    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        project: {
          id: project.id,
        },
        user: {
          id: user.id,
        },
      },
    });
    switch (enrollment?.requestState) {
      case RequestState.Pending:
        throw new BadRequest(
          'Este usuario ya ha solicitado la inscripción en este proyecto',
        );
      case RequestState.Accepted:
        throw new BadRequest('Este usuario ya está inscrito en este proyecto');
      default:
        break;
    }

    await this.enrollmentRepository
      .upsert(
        {
          project: {
            id: project.id,
          },
          user: {
            id: user.id,
          },
          requestState: RequestState.Pending,
          requesterMessage: enrollmentRequest.message,
        },
        { conflictPaths: ['project', 'user'] },
      )
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });

    // Increase project enrollment request count
    await this.projectRepository
      .update(project.id, {
        requestEnrollmentCount: project.requestEnrollmentCount + 1,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });

    this.logger.debug(
      `Project#${project.id} successfully requested enrollment by user#${user.id}`,
    );
  }

  async updateEnrollRequest(
    projectId: number,
    user: CurrentUserWithoutTokens,
    enrollmentRequest: EnrollmentRequestDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFound('El ID no coincide con ningún proyecto');

    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        project: {
          id: project.id,
        },
        user: {
          id: user.id,
        },
      },
    });
    if (!enrollment)
      throw new BadRequest('Este usuario no está inscrito en este proyecto');

    switch (enrollment.requestState) {
      case RequestState.Pending:
        break;
      case RequestState.Accepted:
        throw new BadRequest(
          'Este usuario ya está inscrito en este proyecto, no se puede actualizar la solicitud',
        );
      case RequestState.Unenrolled:
        throw new BadRequest(
          'Este usuario no está inscrito en este proyecto, no se puede actualizar la solicitud',
        );
      case RequestState.Rejected:
        throw new BadRequest(
          'Esta solicitud ha sido rechazada, no se puede actualizar',
        );
      default:
        throw new BadRequest('Estado de solicitud inválido');
    }

    await this.enrollmentRepository
      .update(
        {
          project: {
            id: project.id,
          },
          user: {
            id: user.id,
          },
        },
        {
          requesterMessage: enrollmentRequest.message,
        },
      )
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully updated enrollment request by user#${user.id}`,
    );
  }

  async cancelEnrollRequest(projectId: number, user: CurrentUserWithoutTokens) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'requestEnrollmentCount'],
    });
    if (!project) throw new NotFound('El ID no coincide con ningún proyecto');

    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        project: {
          id: project.id,
        },
        user: {
          id: user.id,
        },
      },
      select: ['id'],
    });
    if (!enrollment)
      throw new BadRequest('This user is not enrolled in this project');

    await this.enrollmentRepository
      .delete({
        project: {
          id: project.id,
        },
        user: {
          id: user.id,
        },
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });

    // Reduce project enrollment request count
    await this.projectRepository
      .update(project.id, {
        requestEnrollmentCount: project.requestEnrollmentCount - 1,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });

    this.logger.debug(
      `Project#${project.id} successfully canceled enrollment by user#${user.id}`,
    );
  }

  async getEnrollRequests(
    projectId: number,
    currentUser: CurrentUserWithoutTokens,
  ): Promise<EnrollmentRequestsShowDto> {
    if (!currentUser)
      throw new BadRequest('Current user is required to fetch enroll requests');

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'requestEnrollmentCount'],
    });

    if (!project) {
      throw new NotFound('Project not found');
    }

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        'No tienes autorización para obtener las solicitudes de inscripción de este proyecto',
      );
    }

    const enrollments = await this.enrollmentRepository.find({
      where: {
        project: {
          id: projectId,
        },
        requestState: RequestState.Pending,
      },
      relations: [
        'user',
        'user.interests',
        'user.userAffiliations',
        'user.userAffiliations.researchDepartment',
        'user.userAffiliations.researchDepartment.facility',
        'user.userAffiliations.researchDepartment.facility.institution',
      ],
    });
    this.logger.debug(
      `Project#${projectId} successfully fetched enroll requests`,
    );
    this.logger.debug(enrollments);

    return {
      enrollmentRequests: this.entityMapper.mapArray(
        EnrollmentRequestShowDto,
        enrollments,
      ),
      requestEnrollmentCount: project.requestEnrollmentCount,
    };
  }

  async unenroll(
    projectId: number,
    user: CurrentUserWithoutTokens,
    unenrollOptions: UnenrollDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw projectNotFoundError;

    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        project: {
          id: project.id,
        },
        user: {
          id: user.id,
        },
      },
    });
    if (!enrollment)
      throw new BadRequest('This user is not enrolled in this project');

    // move to unenroll request state and add message
    await this.enrollmentRepository
      .update(
        {
          project: {
            id: project.id,
          },
          user: {
            id: user.id,
          },
        },
        {
          requestState: RequestState.Unenrolled,
          requesterMessage: unenrollOptions.message,
        },
      )
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully unenrolled by user#${user.id}`,
    );

    // decrease project member count
    await this.projectRepository
      .update(project.id, {
        userCount: project.userCount - 1,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully decreased its member count`,
    );
  }

  async approveEnrollRequest(
    projectId: number,
    userId: number,
    currentUser: CurrentUserWithoutTokens,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'userCount', 'requestEnrollmentCount'],
    });
    if (!project) throw projectNotFoundError;

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        'No tienes autorización para aprobar solicitudes de inscripción en este proyecto',
      );
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        project: {
          id: project.id,
        },
        user: {
          id: userId,
        },
      },
      select: ['id', 'requestState'],
    });
    if (!enrollment)
      throw new BadRequest('Este usuario no tiene una solicitud pendiente');

    if (enrollment.requestState !== RequestState.Pending) {
      throw new BadRequest('Esta solicitud no está pendiente');
    }

    // move to accepted state
    await this.enrollmentRepository
      .update(enrollment.id, {
        requestState: RequestState.Accepted,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully approved enrollment request by user#${userId}`,
    );

    // increase project member count
    await this.projectRepository
      .update(project.id, {
        userCount: project.userCount + 1,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully increased its member count`,
    );

    // decrease project enrollment request count
    await this.projectRepository
      .update(project.id, {
        requestEnrollmentCount: project.requestEnrollmentCount - 1,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully decreased its enrollment request count`,
    );
  }

  async rejectEnrollRequest(
    projectId: number,
    userId: number,
    currentUser: CurrentUserWithoutTokens,
    rejectEnrollRequestDto: EnrollmentRequestRejectDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'requestEnrollmentCount'],
    });
    if (!project) throw projectNotFoundError;

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        'No tienes autorización para rechazar solicitudes de inscripción en este proyecto',
      );
    }

    const enrollment = await this.enrollmentRepository.findOne({
      where: {
        project: {
          id: project.id,
        },
        user: {
          id: userId,
        },
      },
      select: ['id', 'requestState'],
    });
    if (!enrollment)
      throw new BadRequest('Este usuario no tiene una solicitud pendiente');

    if (enrollment.requestState !== RequestState.Pending) {
      throw new BadRequest('Esta solicitud no está pendiente');
    }

    // move to rejected state and include admin message
    await this.enrollmentRepository
      .update(enrollment.id, {
        requestState: RequestState.Rejected,
        adminMessage: rejectEnrollRequestDto.message,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully rejected enrollment request by user#${userId}`,
    );

    // decrease project enrollment request count
    await this.projectRepository
      .update(project.id, {
        requestEnrollmentCount: project.requestEnrollmentCount - 1,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully decreased its enrollment request count`,
    );
  }

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
