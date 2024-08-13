import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
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
import { EnrollmentRequestAdminDto as EnrollmentRequestAdminDto } from '../enrollment/dtos/enrollment-request-admin.dto';
import { EnrollmentChangeRole } from '../enrollment/dtos/enrollment-change-role';
import { ProjectCreateDto } from './dtos/project.create.dto';
import { ProjectShowCreatedDto } from './dtos/project.showCreated.dto';
import { User } from 'src/user/user.entity';
import { ResearchDepartment } from 'src/research-department/department.entity';
import { Interest } from 'src/interest/interest.entity';
import { ProjectUpdateDto } from './dtos/project.update.dto';
import { ProjectUpdateStateDto } from './dtos/project.updateState.dto';
import { RequestWithUser } from 'src/utils/request-with-user';

const projectNotFoundError = new NotFound(
  'El ID no coincide con ningún proyecto',
);

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ResearchDepartment)
    private readonly departmentRepository: Repository<ResearchDepartment>,
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
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

    const query = this.queryCreator.initialQuery();

    const searchQuery = this.queryCreator.applyTextSearch(filters, query);

    const [fuzzyTextSearchQuery, suggestedSearchTerms] =
      await this.queryCreator.applyFuzzyTextSearch(filters, searchQuery);

    const extraFiltersAppliedSearchQuery = this.queryCreator.applyExtraFilters(
      filters,
      fuzzyTextSearchQuery,
      currentUser,
    );

    const projectCount = await extraFiltersAppliedSearchQuery
      .getCount()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    const paginationAppliedQuery = this.queryCreator.applySortingAndPagination(
      extraFiltersAppliedSearchQuery,
      paginationAttributes,
      sortAttributes,
      currentUser,
    );

    this.logger.info(extraFiltersAppliedSearchQuery.getSql());

    const projects = await paginationAppliedQuery
      .getMany()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug('Map projects to dto');
    return {
      projects: this.entityMapper.mapArray(ProjectInListDto, projects),
      projectCount: projectCount,
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
    if (!project) throw projectNotFoundError;

    this.logger.debug('Map project to dto');
    return this.entityMapper.mapValue(ProjectSingleDto, project);
  }

  async create(
    createDto: ProjectCreateDto,
    request: RequestWithUser,
  ): Promise<ProjectShowCreatedDto> {
    this.logger.debug('Create a new project');

    // Validate the user creating the project
    const userId = request.currentUser.id;
    const user: User = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id'],
    });
    if (!user) throw new NotFound(`User #${userId} not found`);

    // If given, validate research department(s)
    if (
      Array.isArray(createDto.researchDepartments) &&
      createDto.researchDepartments.length > 0
    ) {
      for (const departmentId of createDto.researchDepartments) {
        const departmentExists = await this.departmentRepository.findOne({
          where: { id: departmentId },
          select: ['id'],
        });
        if (!departmentExists)
          throw new NotFound(`Research Department #${departmentId} not found`);
      }
    }

    // If given, validate interest(s)
    if (
      Array.isArray(createDto.interestsIds) &&
      createDto.interestsIds.length > 0
    ) {
      for (const interestId of createDto.interestsIds) {
        const interestExists = await this.interestRepository.findOne({
          where: { id: interestId },
          select: ['id'],
        });
        if (!interestExists)
          throw new NotFound(`Interest #${interestId} not found`);
      }
    }

    // Create new interests if needed
    const interestsIDsCreatedList: number[] = [];
    if (
      Array.isArray(createDto.interestsToCreate) &&
      createDto.interestsToCreate.length > 0
    ) {
      for (const interestName of createDto.interestsToCreate) {
        const interestCreated: Interest = await this.interestRepository
          .save({
            name: interestName,
            projectRefsCounter: 1,
            verified: false,
          })
          .catch((err: Error) => {
            throw new DbException(err.message, err.stack);
          });
        interestsIDsCreatedList.push(interestCreated.id);
      }

      const createdProject: Project = await this.projectRepository
        .save({
          name: createDto.name,
          type: createDto.type,
          language: createDto.language,
          description: createDto.description ?? '',
          endDate: createDto.endDate ?? '',
          web: createDto.web ?? '',
        })
        .catch((err: Error) => {
          throw new DbException(err.message, err.stack);
        });

      /*
      After project is created, retrieve its id. 
      Then merge all the interests and update ManyToMany table with those interests and projectId.
      Then take research departments and update ManyToMany table with those departments and projectId. 
      Then create a new enrollment with: created project, current user, role Leader and state Accepted
      */

      // merge interests ids created and interests ids given
      const interestsIds = [
        ...createDto.interestsIds,
        ...interestsIDsCreatedList,
      ];

      // Create enrollment for this project and then update project with the enrollment
      const enrollmentCreated: Enrollment =
        await this.enrollmentRepository.save({
          project: createdProject,
          user: user,
          role: ProjectRole.Leader,
          requestState: RequestState.Accepted,
        });

      this.logger.debug(`Project #${createdProject.id} successfully created`);

      // Return created project
      return this.entityMapper.mapValue(ProjectShowCreatedDto, createdProject);
    }
  }

  async delete(projectId: number): Promise<void> {
    this.logger.debug('Delete a Project');

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFound(`Project #${projectId} not found`);

    // Review 1: add user role validation for deletion
    // Review 2: add logical delete instead of physical delete?

    await this.projectRepository.delete(projectId).catch((err: Error) => {
      throw new DbException(err.message, err.stack);
    });

    this.logger.debug(`Project #${projectId} successfully deleted`);
  }

  async update(id: number, updateDto: ProjectUpdateDto) {
    this.logger.debug('Update a project');

    const project = await this.projectRepository.findOne({
      where: { id },
    });
    if (!project) throw new NotFound(`Project #${id} not found`);

    // Review: this automatic update probably isn't complete
    await this.projectRepository.update(id, updateDto);

    this.logger.debug(`Project #${project.id} successfully updated`);
  }

  async updateState(id: number, updateStateDto: ProjectUpdateStateDto) {
    this.logger.debug('Update state of a project');

    const project = await this.projectRepository.findOne({
      where: { id },
    });
    if (!project) throw new NotFound(`Project #${id} not found`);

    // Update project's state and admin response
    project.requestState = updateStateDto.requestState;
    project.adminMessage = updateStateDto.adminMessage ?? '';

    await this.projectRepository.update(id, project);

    this.logger.debug(`Project #${project.id} successfully updated it's state`);
  }

  async favorite(id: number, user: CurrentUserWithoutTokens) {
    const project = await this.projectRepository.findOne({ where: { id: id } });
    if (!project) throw projectNotFoundError;

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
    if (!project) throw projectNotFoundError;

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
        ['project', 'user'],
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
      select: ['id', 'requestState'],
    });
    if (!enrollment)
      throw new BadRequest('Este usuario no tiene una solicitud pendiente');

    if (
      enrollment.requestState !== RequestState.Pending &&
      enrollment.requestState !== RequestState.Rejected
    ) {
      throw new BadRequest('Esta solicitud no está pendiente o fue rechazada');
    }

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

    // Reduce project enrollment request count only if the request was not rejected
    // As rejected requests are not counted in the requestEnrollmentCount
    if (enrollment.requestState !== RequestState.Rejected) {
      await this.projectRepository
        .update(project.id, {
          requestEnrollmentCount: project.requestEnrollmentCount - 1,
        })
        .catch((e: Error) => {
          throw new DbException(e.message, e.stack);
        });
    }

    this.logger.debug(
      `Project#${project.id} successfully canceled enrollment by user#${user.id}`,
    );
  }

  async ackKick(
    projectId: number,
    user: CurrentUserWithoutTokens,
  ): Promise<void> {
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
      select: ['id', 'requestState'],
    });
    if (!enrollment)
      throw new BadRequest('Este usuario no está inscrito en este proyecto');

    if (enrollment.requestState !== RequestState.Kicked) {
      throw new BadRequest(
        'Este usuario no ha sido expulsado de este proyecto',
      );
    }

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
    this.logger.debug(
      `Project#${project.id} successfully acknowledged kick by user#${user.id}`,
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

  async manageEnrollRequest(
    projectId: number,
    userId: number,
    currentUser: CurrentUserWithoutTokens,
    enrollRequestAdminDto: EnrollmentRequestAdminDto,
    action: 'approve' | 'reject',
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'userCount', 'requestEnrollmentCount'],
    });
    if (!project) throw projectNotFoundError;

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        `No tienes autorización para ${
          action === 'approve' ? 'aprobar' : 'rechazar'
        } solicitudes de inscripción en este proyecto`,
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

    // move to accepted or rejected state
    await this.enrollmentRepository
      .update(enrollment.id, {
        requestState:
          action === 'approve' ? RequestState.Accepted : RequestState.Rejected,
        adminMessage: enrollRequestAdminDto.message,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully ${
        action === 'approve' ? 'approved' : 'rejected'
      } enrollment request by user#${userId}`,
    );

    // increase project member count if approved
    if (action === 'approve') {
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
    }

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

  async kickUser(
    projectId: number,
    userId: number,
    currentUser: CurrentUserWithoutTokens,
    enrollRequestAdminDto: EnrollmentRequestAdminDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'userCount'],
    });
    if (!project) throw projectNotFoundError;

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        'No tienes autorización para expulsar a los usuarios de este proyecto',
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
    if (!enrollment || enrollment.requestState !== RequestState.Accepted) {
      throw new BadRequest('Este usuario no está inscrito en este proyecto');
    }

    // move to Kicked state
    await this.enrollmentRepository
      .update(enrollment.id, {
        requestState: RequestState.Kicked,
        adminMessage: enrollRequestAdminDto.message,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully kicked user#${userId}`,
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

  async changeUserRole(
    projectId: number,
    userId: number,
    currentUser: CurrentUserWithoutTokens,
    enrollRequestAdminDto: EnrollmentChangeRole,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id'],
    });
    if (!project) throw projectNotFoundError;

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        'No tienes autorización para cambiar los roles de los usuarios en este proyecto',
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
    if (!enrollment || enrollment.requestState !== RequestState.Accepted) {
      throw new BadRequest('Este usuario no está inscrito en este proyecto');
    }

    await this.enrollmentRepository
      .update(enrollment.id, {
        role: enrollRequestAdminDto.role,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully changed user#${userId} role`,
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
