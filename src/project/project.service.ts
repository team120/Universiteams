import { Injectable, NotFoundException } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from '../utils/exceptions/database.exception';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import {
  ProjectFilters,
  ProjectFindDto,
  ProjectSortAttributes,
} from './dtos/project.find.dto';
import {
  ProjectInListDto,
  ProjectSingleDto,
  ProjectsResult,
} from './dtos/project.show.dto';
import { QueryCreator } from './project.query.creator';

@Injectable()
export class ProjectService {
  constructor(
    private readonly queryCreator: QueryCreator,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProjectService.name);
  }

  async findProjects(findOptions: ProjectFindDto): Promise<ProjectsResult> {
    const sortAttributes: ProjectSortAttributes = {
      sortBy: findOptions.sortBy,
      inAscendingOrder: findOptions.inAscendingOrder,
    };
    const filters: ProjectFilters = findOptions;
    const query = this.queryCreator.initialProjectQuery();

    const searchQuery = this.queryCreator.applyTextSearch(filters, query);

    const [fuzzyTextSearchQuery, suggestedSearchTerms] =
      await this.queryCreator.applyFuzzyTextSearch(filters, searchQuery);

    const { 1: searchTerms } = fuzzyTextSearchQuery.getQueryAndParameters();

    const extraFiltersAppliedSearchQuery = this.queryCreator.applyExtraFilters(
      filters,
      fuzzyTextSearchQuery,
    );

    const appliedSortingQuery = this.queryCreator.applySorting(
      sortAttributes,
      searchTerms[0],
      extraFiltersAppliedSearchQuery,
    );

    const [paginationAppliedQuery, projectsCount] =
      await this.queryCreator.applyPagination(appliedSortingQuery);

    const projects = await paginationAppliedQuery.getMany();

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
    const project = await this.queryCreator.getOne(id).catch((err: Error) => {
      throw new DbException(err.message, err.stack);
    });

    this.logger.debug(`Project ${project?.id} found`);
    if (!project) throw new NotFoundException();

    this.logger.debug('Map project to dto');
    return this.entityMapper.mapValue(ProjectSingleDto, project);
  }
}
