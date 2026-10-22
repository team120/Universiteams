import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { EntityManager, In, IsNull, Not, Repository } from 'typeorm';
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
  ManageEnrollInvitationAction,
  ManageEnrollRequestAction,
  ProjectRole,
  RequestState,
} from '../enrollment/enrollment.entity';
import { EnrollmentRequestDto } from '../enrollment/dtos/enrollment-request.dto';
import { UnenrollDto } from '../enrollment/dtos/unenroll.dto';
import {
  EnrollmentRequestShowDto,
  EnrollmentRequestsShowDto,
} from '../enrollment/dtos/enrollment-request.show.dto';
import { EnrollmentInvitationShowDto } from '../enrollment/dtos/enrollment-invitation.show.dto';
import { EnrollmentChangeRole } from '../enrollment/dtos/enrollment-change-role';
import { ProjectCreateDto } from './dtos/project.create.dto';
import { ProjectShowCreatedDto } from './dtos/project.showCreated.dto';
import { User } from '../user/user.entity';
import { ResearchDepartment } from '../research-department/department.entity';
import { Interest } from '../interest/interest.entity';
import { ProjectUpdateDto } from './dtos/project.update.dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import {
  emailQueueProcessor,
  enrollmentInvitationEmailJob,
  enrollmentRequestEmailJob,
} from '../email/email.processor';
import {
  EnrollmentInvitationNotifyEmailData,
  EnrollmentRequestNotifyEmailData,
} from '../email/dtos/enrollment-request-email-data.dto';

const projectNotFoundError = new NotFound(
  'El ID no coincide con ningún proyecto',
);

const userNotFoundError = new NotFound('Usuario no encontrado');

const enrollmentChangedError = new BadRequest(
  'La inscripción fue modificada por otra operación, intenta nuevamente',
);

// Keeps validation errors (BadRequest, Unauthorized...) and wraps anything else
const rethrowAsDbException = (err: Error): never => {
  if (err instanceof HttpException) throw err;
  throw new DbException(err.message, err.stack);
};

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
    @InjectQueue(emailQueueProcessor)
    private readonly emailQueue: Queue,
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

  async findSoftDeleted(): Promise<ProjectInListDto[]> {
    const projects = await this.projectRepository.find({
      // return all projects that have been soft deleted
      withDeleted: true,
      where: { logicalDeleteDate: Not(IsNull()) },
    });
    return this.entityMapper.mapArray(ProjectInListDto, projects);
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
    currentUser: CurrentUserWithoutTokens,
  ): Promise<ProjectShowCreatedDto> {
    this.logger.debug('Create a new project');
    const queryRunner =
      this.projectRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      // Validate the user creating the project
      const userId = currentUser.id;
      const user: User = await queryRunner.manager.getRepository(User).findOne({
        where: { id: userId },
        select: ['id'],
      });
      if (!user) throw new NotFound(`Usuario no encontrado`);

      // Validate if there is an existing project with the same name
      const existingProject = await queryRunner.manager
        .getRepository(Project)
        .findOne({
          where: { name: createDto.name },
        });
      if (existingProject) {
        throw new BadRequest(
          'Ya existe un proyecto con el mismo nombre, por favor elige otro nombre',
        );
      }

      // If given, validate research department(s)
      if (
        Array.isArray(createDto.researchDepartmentsIds) &&
        createDto.researchDepartmentsIds.length > 0
      ) {
        for (const departmentId of createDto.researchDepartmentsIds) {
          const departmentExists = await queryRunner.manager
            .getRepository(ResearchDepartment)
            .findOne({
              where: { id: departmentId },
              select: ['id'],
            });
          if (!departmentExists)
            throw new NotFound(`Departamento #${departmentId} no encontrado`);
        }
      }
      // If given, validate interest(s)
      const interestsIDsList: number[] = [];
      if (createDto.interestsIds && createDto.interestsIds.length > 0) {
        for (const interestId of createDto.interestsIds) {
          const interestExists = await queryRunner.manager
            .getRepository(Interest)
            .findOne({
              where: { id: interestId },
              select: ['id'],
            });
          if (!interestExists)
            throw new NotFound(`Interés #${interestId} no encontrado`);
          interestsIDsList.push(interestId);
        }
      }

      // Create new interests if needed
      if (
        createDto.interestsToCreate &&
        createDto.interestsToCreate.length > 0
      ) {
        for (const interestName of createDto.interestsToCreate) {
          const interestCreated: Interest = await queryRunner.manager
            .getRepository(Interest)
            .save({
              name: interestName,
              verified: false,
            })
            .catch((err: Error) => {
              throw new DbException(err.message, err.stack);
            });
          interestsIDsList.push(interestCreated.id);
        }
      }
      if (interestsIDsList.length == 0) {
        throw new BadRequest(
          'Al menos un interés es requerido para crear un proyecto',
        );
      }
      const newProject: Partial<Project> = {
        name: createDto.name,
        type: createDto.type,
        language: createDto.language,
        description: createDto.description,
        endDate: createDto.endDate,
        web: createDto.web,
        userCount: 1,
      };
      // Map interests ids created and interests ids given
      newProject.interests = interestsIDsList.map((interestId) => ({
        id: interestId,
      })) as Interest[];

      newProject.researchDepartments = createDto.researchDepartmentsIds.map(
        (id) => ({
          id: id,
        }),
      ) as ResearchDepartment[];

      this.logger.debug(`Create project: #${newProject}`);
      const createdProject: Project = await queryRunner.manager
        .getRepository(Project)
        .save(newProject)
        .catch((err: Error) => {
          throw new DbException(err.message, err.stack);
        });

      // Create enrollment for this project and then update project with the enrollment
      await queryRunner.manager
        .getRepository(Enrollment)
        .save({
          project: { id: createdProject.id },
          user: { id: user.id },
          role: ProjectRole.Leader,
          requestState: RequestState.Accepted,
        })
        .catch((err: Error) => {
          throw new DbException(err.message, err.stack);
        });

      // Commit the transaction
      await queryRunner.commitTransaction();

      return this.entityMapper.mapValue(ProjectShowCreatedDto, createdProject);
    } catch (error) {
      // Rollback the transaction if an error occurs
      await queryRunner.rollbackTransaction();
      throw new DbException(error.message, error.stack);
    } finally {
      await queryRunner.release();
    }
  }

  async delete(
    projectId: number,
    currentUser: CurrentUserWithoutTokens,
  ): Promise<void> {
    this.logger.debug('Delete a Project');
    // Verify user role: Only leader is allowed to delete the project
    if (!(await this.validateLeaderRoleInProject(currentUser.id, projectId))) {
      throw new Unauthorized('Solo el lider del proyecto puede eliminarlo');
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFound(`Proyecto #${projectId} no encontrado`);

    // Perform softDelete instead of hard delete in order to be able to restore entity in the future
    await this.projectRepository.softDelete(projectId).catch((err: Error) => {
      throw new DbException(err.message, err.stack);
    });
    this.logger.debug(`Project #${projectId} successfully deleted`);
  }

  async update(
    projectId: number,
    updateDto: ProjectUpdateDto,
    currentUser: CurrentUserWithoutTokens,
  ): Promise<Project> {
    this.logger.debug('Update a project');
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFound(`Proyecto #${projectId} no encontrado`);
    // Verify user role: Only leader is allowed to update the project
    if (!(await this.validateLeaderRoleInProject(currentUser.id, projectId))) {
      throw new Unauthorized(
        'Solo el lider del proyecto puede actualizar sus datos',
      );
    }

    // Validate if there is an existing project with the same name
    if (updateDto.name !== project.name) {
      const existingProject = await this.projectRepository.findOne({
        where: { name: updateDto.name },
      });
      if (existingProject) {
        throw new BadRequest(
          'Ya existe un proyecto con el mismo nombre, por favor elige otro nombre',
        );
      }
    }
    // If given, validate research department(s)
    if (
      Array.isArray(updateDto.researchDepartmentsIds) &&
      updateDto.researchDepartmentsIds.length > 0
    ) {
      for (const departmentId of updateDto.researchDepartmentsIds) {
        const departmentExists = await this.departmentRepository.findOne({
          where: { id: departmentId },
          select: ['id'],
        });
        if (!departmentExists)
          throw new NotFound(`Departamento #${departmentId} no encontrado`);
      }
    }

    // If given, validate interest(s)
    const interestsIDsList: number[] = [];
    if (updateDto.interestsIds && updateDto.interestsIds.length > 0) {
      for (const interestId of updateDto.interestsIds) {
        const interestExists = await this.interestRepository.findOne({
          where: { id: interestId },
          select: ['id'],
        });
        if (!interestExists)
          throw new NotFound(`Interés #${interestId} no encontrado`);
        interestsIDsList.push(interestId);
      }
    }

    // Create new interests if needed
    if (updateDto.interestsToCreate && updateDto.interestsToCreate.length > 0) {
      for (const interestName of updateDto.interestsToCreate) {
        const interestCreated: Interest = await this.interestRepository.save({
          name: interestName,
          verified: false,
        });
        interestsIDsList.push(interestCreated.id);
      }
    }

    // Update project with the new data
    project.name = updateDto.name;
    project.type = updateDto.type;
    project.description = updateDto.description;
    project.endDate = updateDto.endDate;
    project.web = updateDto.web;

    if (interestsIDsList.length > 0) {
      project.interests = await this.interestRepository.findBy({
        id: In(interestsIDsList),
      });
    }

    if (
      updateDto.researchDepartmentsIds &&
      updateDto.researchDepartmentsIds.length > 0
    ) {
      project.researchDepartments = await this.departmentRepository.findBy({
        id: In(updateDto.researchDepartmentsIds),
      });
    }

    const updatedProject: Project = await this.projectRepository
      .save(project)
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug(`Project #${project.id} successfully updated`);
    return updatedProject;
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
        'Este proyecto ya ha sido marcado como favorito por este usuario',
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
      throw new BadRequest(
        'Este proyecto no ha sido marcado como favorito por este usuario',
      );

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
    const queryRunner =
      this.projectRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const project = await queryRunner.manager.findOne(Project, {
        where: { id: projectId },
        select: ['id', 'name', 'requestEnrollmentCount'],
      });
      if (!project) throw projectNotFoundError;

      // Runs requests and invitations for this user one at a time
      await this.lockUser(queryRunner.manager, user.id);

      const enrollment = await this.findEnrollment(
        queryRunner.manager,
        project.id,
        user.id,
      );
      this.assertCanStartEnrollment(enrollment);

      // Reset every field a previous enrollment or invitation may have left
      const pendingEnrollment: Partial<Enrollment> = {
        project: {
          id: project.id,
        } as Project,
        user: {
          id: user.id,
        } as User,
        senderId: null,
        role: ProjectRole.Member,
        requestState: RequestState.Pending,
        requesterMessage: enrollmentRequest.message,
        adminMessage: null,
      };
      await queryRunner.manager.upsert(Enrollment, pendingEnrollment, [
        'project',
        'user',
      ]);

      // Increase project enrollment request count
      await queryRunner.manager.increment(
        Project,
        { id: project.id },
        'requestEnrollmentCount',
        1,
      );

      await queryRunner.commitTransaction();

      await this.emailQueue
        .add(enrollmentRequestEmailJob, {
          project: project,
          user: user,
        } as EnrollmentRequestNotifyEmailData)
        .catch((err: Error) => {
          this.logger.error(err, err.message);
        });

      this.logger.debug(
        `Project#${project.id} successfully requested enrollment by user#${user.id}`,
      );
    } catch (err) {
      await queryRunner.rollbackTransaction();
      rethrowAsDbException(err);
    } finally {
      await queryRunner.release();
    }
  }

  async updateEnrollRequest(
    projectId: number,
    user: CurrentUserWithoutTokens,
    enrollmentRequest: EnrollmentRequestDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id'],
    });
    if (!project) throw projectNotFoundError;

    await this.projectRepository.manager
      .transaction(async (manager) => {
        const enrollment = await this.lockAndFindEnrollment(
          manager,
          project.id,
          user.id,
        );
        if (!enrollment)
          throw new BadRequest(
            'Este usuario no está inscripto en este proyecto',
          );

        switch (enrollment.requestState) {
          case RequestState.Pending:
            // An invitation is answered with accept or decline, not edited
            if (enrollment.senderId !== null)
              throw new BadRequest(
                'Este usuario no tiene una solicitud pendiente',
              );
            break;
          case RequestState.Accepted:
            throw new BadRequest(
              'Este usuario ya está inscripto en este proyecto, no se puede actualizar la solicitud',
            );
          case RequestState.Unenrolled:
            throw new BadRequest(
              'Este usuario no está inscripto en este proyecto, no se puede actualizar la solicitud',
            );
          case RequestState.Rejected:
            throw new BadRequest(
              'Esta solicitud ha sido rechazada, no se puede actualizar',
            );
          default:
            throw new BadRequest('Estado de solicitud inválido');
        }

        await this.changeEnrollmentState(manager, enrollment, {
          requesterMessage: enrollmentRequest.message,
        });
      })
      .catch(rethrowAsDbException);

    this.logger.debug(
      `Project#${project.id} successfully updated enrollment request by user#${user.id}`,
    );
  }

  async cancelEnrollRequest(projectId: number, user: CurrentUserWithoutTokens) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id'],
    });
    if (!project) throw projectNotFoundError;

    await this.projectRepository.manager
      .transaction(async (manager) => {
        const enrollment = await this.lockAndFindEnrollment(
          manager,
          project.id,
          user.id,
        );
        // An invitation is answered with accept or decline, not canceled
        if (!enrollment || enrollment.senderId !== null)
          throw new BadRequest('Este usuario no tiene una solicitud pendiente');

        if (
          enrollment.requestState !== RequestState.Pending &&
          enrollment.requestState !== RequestState.Rejected
        ) {
          throw new BadRequest(
            'Esta solicitud no está pendiente o fue rechazada',
          );
        }

        await this.deleteEnrollment(manager, enrollment);

        // Reduce project enrollment request count only if the request was not rejected
        // As rejected requests are not counted in the requestEnrollmentCount
        if (enrollment.requestState !== RequestState.Rejected) {
          await manager.decrement(
            Project,
            { id: project.id },
            'requestEnrollmentCount',
            1,
          );
        }
      })
      .catch(rethrowAsDbException);

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
      select: ['id'],
    });
    if (!project) throw projectNotFoundError;

    await this.projectRepository.manager
      .transaction(async (manager) => {
        const enrollment = await this.lockAndFindEnrollment(
          manager,
          project.id,
          user.id,
        );
        if (!enrollment)
          throw new BadRequest(
            'Este usuario no está inscripto en este proyecto',
          );

        if (enrollment.requestState !== RequestState.Kicked) {
          throw new BadRequest(
            'Este usuario no ha sido expulsado de este proyecto',
          );
        }

        await this.deleteEnrollment(manager, enrollment);
      })
      .catch(rethrowAsDbException);

    this.logger.debug(
      `Project#${project.id} successfully acknowledged kick by user#${user.id}`,
    );
  }

  async getEnrollRequests(
    projectId: number,
    currentUser: CurrentUserWithoutTokens,
  ): Promise<EnrollmentRequestsShowDto> {
    if (!currentUser)
      throw new BadRequest(
        'El usuario actual es requerido para obtener las solicitudes de inscripción',
      );

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'requestEnrollmentCount'],
    });

    if (!project) {
      throw new NotFound('Proyecto no encontrado');
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
        senderId: IsNull(),
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

  // Pending and declined invitations, so admins can update, cancel or dismiss
  // them
  async getEnrollInvitations(
    projectId: number,
    currentUser: CurrentUserWithoutTokens,
  ): Promise<EnrollmentInvitationShowDto[]> {
    if (!currentUser)
      throw new BadRequest(
        'El usuario actual es requerido para obtener las invitaciones de inscripción',
      );

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id'],
    });

    if (!project) {
      throw new NotFound('Proyecto no encontrado');
    }

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        'No tienes autorización para obtener las invitaciones de inscripción de este proyecto',
      );
    }

    const enrollments = await this.enrollmentRepository.find({
      where: {
        project: {
          id: projectId,
        },
        requestState: In([RequestState.Pending, RequestState.Declined]),
        senderId: Not(IsNull()),
      },
      relations: [
        'user',
        'user.interests',
        'user.userAffiliations',
        'user.userAffiliations.researchDepartment',
        'user.userAffiliations.researchDepartment.facility',
        'user.userAffiliations.researchDepartment.facility.institution',
        'sender',
      ],
      order: { id: 'ASC' },
    });
    this.logger.debug(
      `Project#${projectId} successfully fetched enroll invitations`,
    );

    return this.entityMapper.mapArray(EnrollmentInvitationShowDto, enrollments);
  }

  async unenroll(
    projectId: number,
    user: CurrentUserWithoutTokens,
    unenrollOptions: UnenrollDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id'],
    });
    if (!project) throw projectNotFoundError;

    await this.projectRepository.manager
      .transaction(async (manager) => {
        const enrollment = await this.lockAndFindEnrollment(
          manager,
          project.id,
          user.id,
        );
        if (!enrollment || enrollment.requestState !== RequestState.Accepted)
          throw new BadRequest(
            'Este usuario no está inscripto en este proyecto',
          );

        // move to unenroll request state and add message
        await this.changeEnrollmentState(manager, enrollment, {
          requestState: RequestState.Unenrolled,
          requesterMessage: unenrollOptions.message,
        });

        // decrease project member count
        await manager.decrement(Project, { id: project.id }, 'userCount', 1);
      })
      .catch(rethrowAsDbException);

    this.logger.debug(
      `Project#${project.id} successfully unenrolled by user#${user.id}`,
    );
  }

  async manageEnrollRequest(
    projectId: number,
    userId: number,
    currentUser: CurrentUserWithoutTokens,
    enrollRequestAdminDto: EnrollmentRequestDto,
    action: ManageEnrollRequestAction,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id'],
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

    await this.projectRepository.manager
      .transaction(async (manager) => {
        const enrollment = await this.lockAndFindEnrollment(
          manager,
          project.id,
          userId,
        );
        // An invitation is not a request: only the invited user can answer it
        if (!enrollment || enrollment.senderId !== null)
          throw new BadRequest('Este usuario no tiene una solicitud pendiente');

        if (enrollment.requestState !== RequestState.Pending) {
          throw new BadRequest('Esta solicitud no está pendiente');
        }

        // move to accepted or rejected state
        await this.changeEnrollmentState(manager, enrollment, {
          requestState:
            action === 'approve'
              ? RequestState.Accepted
              : RequestState.Rejected,
          adminMessage: enrollRequestAdminDto.message,
        });

        // increase project member count if approved
        if (action === 'approve') {
          await manager.increment(Project, { id: project.id }, 'userCount', 1);
        }

        await manager.decrement(
          Project,
          { id: project.id },
          'requestEnrollmentCount',
          1,
        );
      })
      .catch(rethrowAsDbException);

    this.logger.debug(
      `Project#${project.id} successfully ${
        action === 'approve' ? 'approved' : 'rejected'
      } enrollment request by user#${userId}`,
    );
  }

  async createEnrollInvitation(
    projectId: number,
    userId: number,
    currentUser: CurrentUserWithoutTokens,
    invitation: EnrollmentRequestDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id', 'name'],
    });
    if (!project) throw projectNotFoundError;

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        'No tienes autorización para enviar invitaciones de inscripción a este proyecto',
      );
    }

    const invitedUser = await this.projectRepository.manager
      .transaction(async (manager) => {
        // Runs requests and invitations for this user one at a time
        const user = await manager.findOne(User, {
          where: { id: userId },
          select: ['id', 'email', 'firstName', 'lastName'],
          lock: { mode: 'pessimistic_write' },
        });
        if (!user) throw userNotFoundError;

        const enrollment = await this.findEnrollment(
          manager,
          project.id,
          user.id,
        );
        this.assertCanStartEnrollment(enrollment);

        // Reset every field a previous enrollment or invitation may have left
        const pendingInvitation: Partial<Enrollment> = {
          project: {
            id: project.id,
          } as Project,
          user: {
            id: user.id,
          } as User,
          senderId: currentUser.id,
          role: ProjectRole.Member,
          requestState: RequestState.Pending,
          requesterMessage: null,
          adminMessage: invitation.message,
        };
        await manager.upsert(Enrollment, pendingInvitation, [
          'project',
          'user',
        ]);

        return user;
      })
      .catch(rethrowAsDbException);

    await this.emailQueue
      .add(enrollmentInvitationEmailJob, {
        project: project,
        user: invitedUser,
      } as EnrollmentInvitationNotifyEmailData)
      .catch((err: Error) => {
        this.logger.error(err, err.message);
      });

    this.logger.debug(
      `Project#${project.id} successfully invited user#${invitedUser.id} to enroll by user#${currentUser.id}`,
    );
  }

  async updateEnrollInvitation(
    projectId: number,
    userId: number,
    currentUser: CurrentUserWithoutTokens,
    invitation: EnrollmentRequestDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id'],
    });
    if (!project) throw projectNotFoundError;

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        'No tienes autorización para modificar invitaciones de inscripción a este proyecto',
      );
    }

    await this.projectRepository.manager
      .transaction(async (manager) => {
        const enrollment = await this.lockAndFindEnrollment(
          manager,
          project.id,
          userId,
        );
        if (
          !enrollment ||
          enrollment.senderId === null ||
          enrollment.requestState !== RequestState.Pending
        ) {
          throw new BadRequest(
            'Este usuario no tiene una invitación pendiente',
          );
        }

        await this.changeEnrollmentState(manager, enrollment, {
          adminMessage: invitation.message,
        });
      })
      .catch(rethrowAsDbException);
    this.logger.debug(
      `Project#${project.id} successfully updated enrollment invitation to user#${userId}`,
    );
  }

  async cancelEnrollInvitation(
    projectId: number,
    userId: number,
    currentUser: CurrentUserWithoutTokens,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id'],
    });
    if (!project) throw projectNotFoundError;

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        'No tienes autorización para cancelar invitaciones de inscripción a este proyecto',
      );
    }

    await this.projectRepository.manager
      .transaction(async (manager) => {
        const enrollment = await this.lockAndFindEnrollment(
          manager,
          project.id,
          userId,
        );
        if (!enrollment || enrollment.senderId === null)
          throw new BadRequest(
            'Este usuario no tiene una invitación pendiente',
          );

        if (
          enrollment.requestState !== RequestState.Pending &&
          enrollment.requestState !== RequestState.Declined
        ) {
          throw new BadRequest(
            'Esta invitación no está pendiente o fue declinada',
          );
        }

        await this.deleteEnrollment(manager, enrollment);
      })
      .catch(rethrowAsDbException);

    this.logger.debug(
      `Project#${project.id} successfully canceled enrollment invitation to user#${userId}`,
    );
  }

  async manageEnrollInvitation(
    projectId: number,
    currentUser: CurrentUserWithoutTokens,
    invitationAnswer: EnrollmentRequestDto,
    action: ManageEnrollInvitationAction,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id'],
    });
    if (!project) throw projectNotFoundError;

    await this.projectRepository.manager
      .transaction(async (manager) => {
        const enrollment = await this.lockAndFindEnrollment(
          manager,
          project.id,
          currentUser.id,
        );
        if (
          !enrollment ||
          enrollment.senderId === null ||
          enrollment.requestState !== RequestState.Pending
        ) {
          throw new BadRequest(
            'No tienes una invitación pendiente para este proyecto',
          );
        }

        // move to accepted or declined state
        await this.changeEnrollmentState(manager, enrollment, {
          requestState:
            action === 'accept' ? RequestState.Accepted : RequestState.Declined,
          requesterMessage: invitationAnswer.message,
        });

        // increase project member count if accepted
        if (action === 'accept') {
          await manager.increment(Project, { id: project.id }, 'userCount', 1);
        }
      })
      .catch(rethrowAsDbException);

    this.logger.debug(
      `Project#${project.id} successfully ${
        action === 'accept' ? 'accepted' : 'declined'
      } enrollment invitation by user#${currentUser.id}`,
    );
  }

  async kickUser(
    projectId: number,
    userId: number,
    currentUser: CurrentUserWithoutTokens,
    enrollRequestAdminDto: EnrollmentRequestDto,
  ) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      select: ['id'],
    });
    if (!project) throw projectNotFoundError;

    const isUserAdmin = await this.isUserAdmin(currentUser, projectId);
    if (!isUserAdmin) {
      throw new Unauthorized(
        'No tienes autorización para expulsar a los usuarios de este proyecto',
      );
    }

    await this.projectRepository.manager
      .transaction(async (manager) => {
        const enrollment = await this.lockAndFindEnrollment(
          manager,
          project.id,
          userId,
        );
        if (!enrollment || enrollment.requestState !== RequestState.Accepted) {
          throw new BadRequest(
            'Este usuario no está inscripto en este proyecto',
          );
        }

        // Move to Kicked state
        await this.changeEnrollmentState(manager, enrollment, {
          requestState: RequestState.Kicked,
          adminMessage: enrollRequestAdminDto.message,
        });

        // decrease project member count
        await manager.decrement(Project, { id: project.id }, 'userCount', 1);
      })
      .catch(rethrowAsDbException);

    this.logger.debug(
      `Project#${project.id} successfully kicked user#${userId}`,
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
        'No tienes autorización para cambiar los roles a los usuarios en este proyecto',
      );
    }

    await this.projectRepository.manager
      .transaction(async (manager) => {
        const enrollment = await this.lockAndFindEnrollment(
          manager,
          project.id,
          userId,
        );
        if (!enrollment || enrollment.requestState !== RequestState.Accepted) {
          throw new BadRequest(
            'Este usuario no está inscripto en este proyecto',
          );
        }

        await this.changeEnrollmentState(manager, enrollment, {
          role: enrollRequestAdminDto.role,
        });
      })
      .catch(rethrowAsDbException);

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
      // A kicked or unenrolled admin keeps the role but is no longer a member
      .andWhere('enrollment.requestState = :acceptedState', {
        acceptedState: RequestState.Accepted,
      })
      .getOne();

    if (!currentUserEnrollment) return false;

    return true;
  }

  private async validateLeaderRoleInProject(
    userId: number,
    projectId: number,
  ): Promise<boolean> {
    const userEnrollment = await this.enrollmentRepository.findOne({
      where: {
        project: { id: projectId },
        user: { id: userId },
      },
      select: ['id', 'role', 'requestState'],
    });
    if (!userEnrollment)
      throw new NotFound(
        'No se encontro una inscripción para este usuario y proyecto',
      );
    // A kicked or unenrolled leader keeps the role but is no longer a member
    return (
      userEnrollment.role === ProjectRole.Leader &&
      userEnrollment.requestState === RequestState.Accepted
    );
  }

  private findEnrollment(
    manager: EntityManager,
    projectId: number,
    userId: number,
  ): Promise<Enrollment | null> {
    return manager.findOne(Enrollment, {
      where: {
        project: { id: projectId },
        user: { id: userId },
      },
      select: ['id', 'requestState', 'senderId'],
    });
  }

  // A new request or invitation can't replace a pending or accepted enrollment
  private assertCanStartEnrollment(enrollment: Enrollment | null) {
    switch (enrollment?.requestState) {
      case RequestState.Pending:
        if (enrollment.senderId !== null) {
          throw new BadRequest(
            'Este usuario ya ha sido invitado para inscribirse en este proyecto',
          );
        }
        throw new BadRequest(
          'Este usuario ya ha solicitado la inscripción en este proyecto',
        );
      case RequestState.Accepted:
        throw new BadRequest('Este usuario ya está inscripto en este proyecto');
      default:
        break;
    }
  }

  // Locks the enrolled user first, so any concurrent change to this user's
  // enrollments has committed before the enrollment is read
  private async lockAndFindEnrollment(
    manager: EntityManager,
    projectId: number,
    userId: number,
  ): Promise<Enrollment | null> {
    await this.lockUser(manager, userId);
    return this.findEnrollment(manager, projectId, userId);
  }

  private async lockUser(manager: EntityManager, userId: number) {
    await manager.findOne(User, {
      where: { id: userId },
      select: ['id'],
      lock: { mode: 'pessimistic_write' },
    });
  }

  // Updates the enrollment only if its state is still the one that was read,
  // so concurrent calls can't apply the same change (and counters) twice
  private async changeEnrollmentState(
    manager: EntityManager,
    enrollment: Enrollment,
    changes: Partial<
      Pick<
        Enrollment,
        'requestState' | 'requesterMessage' | 'adminMessage' | 'role'
      >
    >,
  ) {
    const result = await manager.update(
      Enrollment,
      { id: enrollment.id, requestState: enrollment.requestState },
      changes,
    );
    if (result.affected !== 1) throw enrollmentChangedError;
  }

  private async deleteEnrollment(
    manager: EntityManager,
    enrollment: Enrollment,
  ) {
    const result = await manager.delete(Enrollment, {
      id: enrollment.id,
      requestState: enrollment.requestState,
    });
    if (result.affected !== 1) throw enrollmentChangedError;
  }
}
