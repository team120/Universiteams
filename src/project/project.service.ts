import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from '../utils/exceptions/exceptions';
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
import { ProjectPropCompute } from './project.prop-compute';
import { QueryCreator } from './project.query.creator';

@Injectable()
export class ProjectService {
  constructor(
    private readonly queryCreator: QueryCreator,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
    private readonly propCompute: ProjectPropCompute,
  ) {
    this.logger.setContext(ProjectService.name);
  }

  async findProjects(findOptions: ProjectFindDto): Promise<ProjectsResult> {
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

    const [sortingAppliedQuery, orderByClause] = this.queryCreator.applySorting(
      sortAttributes,
      extraFiltersAppliedSearchQuery,
    );

    const [paginationAppliedQuery, projectsCount] =
      await this.queryCreator.applyPagination(
        sortingAppliedQuery,
        paginationAttributes,
        orderByClause,
      );

    const projects = await paginationAppliedQuery
      .getMany()
      .then((projects) => projects?.map((p) => this.propCompute.addIsDown(p)))
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

    const project = await projectFindOneQuery
      .getOne()
      .then((p) => this.propCompute.addIsDown(p))
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug(`Project ${project?.id} found`);
    if (!project) throw new NotFoundException();

    this.logger.debug('Map project to dto');
    return this.entityMapper.mapValue(ProjectSingleDto, project);
  }
}
