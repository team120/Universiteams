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
import { Enrollment, RequestState } from '../enrollment/enrolment.entity';

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

  async findOne(id: number): Promise<ProjectSingleDto> {
    this.logger.debug(
      'Find project with matching ids and their related department, users, user institution and department institution',
    );
    const projectFindOneQuery = this.queryCreator.findOne(id);

    const project = await projectFindOneQuery.getOne().catch((err: Error) => {
      throw new DbException(err.message, err.stack);
    });

    this.logger.debug(`Project ${project?.id} found`);
    if (!project) throw new NotFound('Id does not match with any project');

    this.logger.debug('Map project to dto');
    return this.entityMapper.mapValue(ProjectSingleDto, project);
  }

  async favorite(id: number, user: CurrentUserWithoutTokens) {
    const project = await this.projectRepository.findOne({ where: { id: id } });
    if (!project) throw new NotFound('Id does not match with any project');

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
    if (!project) throw new NotFound('Id does not match with any project');

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

  async requestEnroll(projectId: number, user: CurrentUserWithoutTokens) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });
    if (!project) throw new NotFound('Id does not match with any project');

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
    if (enrollment)
      throw new BadRequest('This user is already enrolled in this project');

    await this.enrollmentRepository
      .insert({
        project: {
          id: project.id,
        },
        user: {
          id: user.id,
        },
        requestState: RequestState.Pending,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully requested enrollment by user#${user.id}`,
    );
  }
}
