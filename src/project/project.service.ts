import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { CurrentUserWithoutTokens } from '../auth/dtos/current-user.dto';
import { Bookmark } from '../bookmark/bookmark.entity';
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
import { ProjectPropCompute } from './project.prop-compute';
import { QueryCreator } from './project.query.creator';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
    private readonly queryCreator: QueryCreator,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
    private readonly propCompute: ProjectPropCompute,
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
    );
    this.logger.debug(
      { query: extraFiltersAppliedSearchQuery.getSql() },
      'filtered',
    );

    const [sortingAppliedQuery, orderByClause] = this.queryCreator.applySorting(
      sortAttributes,
      extraFiltersAppliedSearchQuery,
    );
    this.logger.debug({ query: sortingAppliedQuery.getSql() }, 'sorted');

    const [paginationAppliedQuery, projectsCount] =
      await this.queryCreator.applyPagination(
        sortingAppliedQuery,
        paginationAttributes,
        orderByClause,
        currentUser,
      );
    this.logger.debug(paginationAppliedQuery.getSql());

    const { entities, raw } = await paginationAppliedQuery
      .getRawAndEntities()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug(raw[0], 'raw results');

    this.logger.debug('Map projects to dto');
    return {
      projects: this.entityMapper.mapArray(
        ProjectInListDto,
        entities.map((p) => this.propCompute.addIsDown(p)),
      ),
      projectCount: projectsCount,
      suggestedSearchTerms: suggestedSearchTerms,
    };
  }

  async findOne(id: number): Promise<ProjectSingleDto> {
    this.logger.debug(
      'Find project with matching ids and their related department, users, user institution and department institution',
    );
    const projectFindOneQuery = this.queryCreator.findOne(id);

    const project = await projectFindOneQuery
      .getOne()
      .then((p) => this.propCompute.addIsDown(p))
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug(`Project ${project?.id} found`);
    if (!project) throw new NotFound('Id does not match with any project');

    this.logger.debug('Map project to dto');
    return this.entityMapper.mapValue(ProjectSingleDto, project);
  }

  async bookmark(id: number, user: CurrentUserWithoutTokens) {
    const project = await this.projectRepository.findOne({ where: { id: id } });
    if (!project) throw new NotFound('Id does not match with any project');

    const bookmark = await this.bookmarkRepository.findOne({
      where: {
        projectId: project.id,
        userId: user.id,
      },
    });
    if (bookmark)
      throw new BadRequest(
        'This project has been already bookmarked by this user',
      );

    await this.bookmarkRepository
      .insert({
        projectId: project.id,
        userId: user.id,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully bookmarked by user#${user.id}`,
    );

    await this.projectRepository
      .update(project.id, {
        bookmarkCount: project.bookmarkCount + 1,
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    this.logger.debug(
      `Project#${project.id} successfully increased its bookmark count`,
    );
  }
}
