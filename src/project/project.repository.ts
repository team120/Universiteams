import { Injectable, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { DbException } from '../utils/exceptions/database.exception';
import { ProjectFilters, ProjectSortAttributes } from './dtos/project.find.dto';
import { Project } from './project.entity';
import { UniqueWords } from './uniqueWords.entity';

@Injectable()
export class QueryCreator {
  private sortBy = new Map([
    ['name', 'project.name'],
    ['researchDepartment', 'researchDepartment.name'],
    ['facility', 'researchDepartmentFacility.name'],
    ['creationDate', 'project.creationDate'],
    ['type', 'project.type'],
  ]);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(UniqueWords)
    private readonly uniqueWordsRepository: Repository<UniqueWords>,
    private readonly logger: PinoLogger,
  ) {}

  getMatchingWords(searchTerms: string): Promise<string[]> {
    const isolatedTerms = searchTerms.split(' ');
    return Promise.all(
      isolatedTerms.map((term) =>
        this.uniqueWordsRepository
          .createQueryBuilder()
          .where(`similarity(word, :term) > 0`, { term: term })
          // to avoid sql injections, since typeorm doesn't support prepared statements in order by clauses
          .orderBy(`word <-> format('%L', '${term}')`)
          .limit(5)
          .getMany()
          .then((uniqueTerms) =>
            uniqueTerms.map((uniqueTerm) => uniqueTerm.word),
          ),
      ),
    ).then((termsWithMatchs) =>
      termsWithMatchs.reduce((joinedMatchs, termWithMatchs) =>
        joinedMatchs.map((joinedTerm, i) =>
          joinedTerm.concat(
            ` ${
              termWithMatchs[i] ??
              termWithMatchs.filter((t) => t !== undefined)[0] ??
              ''
            }`,
          ),
        ),
      ),
    );
  }

  applySorting(
    sortAttributes: ProjectSortAttributes,
    searchTerms: string,
    query: SelectQueryBuilder<Project>,
  ) {
    const newQuery = query;
    if (sortAttributes.sortBy) {
      const sortByProperty = this.sortBy.get(sortAttributes.sortBy);
      this.logger.debug(
        `Sort by ${sortByProperty} in ${
          sortAttributes.inAscendingOrder ? 'ascending' : 'descending'
        } order`,
      );
      if (sortByProperty) {
        return newQuery.orderBy(
          sortByProperty,
          sortAttributes.inAscendingOrder === true ? 'ASC' : 'DESC',
        );
      }
    }
    return newQuery.orderBy(
      `ts_rank(document_with_weights, to_tsquery(project.language::regconfig, format('%L', '${searchTerms}')))`,
    );
  }

  applyTextSearch(filters: ProjectFilters, query: SelectQueryBuilder<Project>) {
    const searchQuery = query;
    if (filters.generalSearch) {
      const fullTextSearchConversion = filters.generalSearch
        .replace(/\s/g, ':* & ')
        .concat(':*');

      searchQuery.where(
        `p_index.document_with_weights @@ to_tsquery(project.language::regconfig, :generalSearch)`,
        {
          generalSearch: fullTextSearchConversion,
        },
      );

      return searchQuery;
    }

    return query;
  }

  async applyFuzzyTextSearch(
    filters: ProjectFilters,
    query: SelectQueryBuilder<Project>,
  ): Promise<[SelectQueryBuilder<Project>, string[]?]> {
    if (filters.generalSearch) {
      const projectsCountNormalSearch = await query.getCount();
      if (projectsCountNormalSearch == 0) {
        const matchingWords = await this.getMatchingWords(
          filters.generalSearch,
        );

        const fuzzySearchQuery = this.getProjectWithRelationsQuery().where(
          `p_index.document_with_weights @@ to_tsquery(project.language::regconfig, :generalSearch)`,
          {
            generalSearch: matchingWords[0].replace(/\s/g, ' & '),
          },
        );

        return [fuzzySearchQuery, matchingWords];
      }
    }
    return [query, undefined];
  }

  applyExtraFilters(
    filters: ProjectFilters,
    query: SelectQueryBuilder<Project>,
  ): SelectQueryBuilder<Project> {
    const newQuery = query;
    if (filters.institutionId) {
      newQuery.andWhere(`userInstitution.id = :userInstitutionId`, {
        userInstitutionId: filters.institutionId,
      });
    }
    if (filters.researchDepartmentId) {
      newQuery.andWhere('researchDepartment.id = :researchDepartmentId', {
        researchDepartmentId: filters.researchDepartmentId,
      });
    }
    if (filters.type) {
      newQuery.andWhere('project.type = :type', { type: filters.type });
    }
    if (filters.isDown) {
      newQuery.andWhere('project.isDown = :isDown', {
        isDown: filters.isDown,
      });
    }
    if (filters.userId) {
      newQuery.andWhere('user.id = :userId', { userId: filters.userId });
    }
    if (filters.dateFrom) {
      newQuery.andWhere('project.creationDate >= :dateFrom', {
        dateFrom: filters.dateFrom.toISOString().split('T')[0],
      });
    }

    return newQuery;
  }

  async joinFilteredRelations(
    query: SelectQueryBuilder<Project>,
  ): Promise<[SelectQueryBuilder<Project>, number]> {
    const [projectIds, projectCount] = await query
      .select('project.id')
      .getManyAndCount();

    return [
      this.getProjectWithRelationsQuery().whereInIds(projectIds),
      projectCount,
    ];
  }

  getProjectWithRelationsQuery(): SelectQueryBuilder<Project> {
    return this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project_search_index', 'p_index', 'p_index.id = project.id')
      .innerJoinAndSelect('project.enrollments', 'enrollment')
      .innerJoinAndSelect('enrollment.user', 'user')
      .leftJoinAndSelect('user.userAffiliations', 'userAffiliation')
      .leftJoinAndSelect(
        'userAffiliation.researchDepartment',
        'userResearchDepartment',
      )
      .leftJoinAndSelect('userResearchDepartment.facility', 'userFacility')
      .leftJoinAndSelect('userFacility.institution', 'userInstitution')
      .leftJoinAndSelect('project.researchDepartment', 'researchDepartment')
      .leftJoinAndSelect(
        'researchDepartment.facility',
        'researchDepartmentFacility',
      )
      .leftJoinAndSelect(
        'researchDepartmentFacility.institution',
        'researchDepartmentInstitution',
      );
  }
}

@Injectable()
export class ProjectCustomRepository {
  constructor(
    private readonly logger: PinoLogger,
    private readonly queryCreator: QueryCreator,
  ) {}

  async findOne(id: number): Promise<Project> {
    const project = await this.queryCreator
      .getProjectWithRelationsQuery()
      .leftJoinAndSelect('project.interests', 'interests')
      .where('project.id = :projectId', { projectId: id })
      .getOne()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    this.logger.debug(project);
    return project;
  }

  async getMatchingProjectIds(
    filters: ProjectFilters,
    sortAttributes: ProjectSortAttributes,
  ) {
    const query = this.queryCreator.getProjectWithRelationsQuery();

    const searchQuery = this.queryCreator.applyTextSearch(filters, query);

    const [fuzzyTextSearchQuery, suggestedSearchTerms] =
      await this.queryCreator.applyFuzzyTextSearch(filters, searchQuery);

    const { 1: searchTerms } = fuzzyTextSearchQuery.getQueryAndParameters();

    const extraFiltersAppliedSearchQuery = this.queryCreator.applyExtraFilters(
      filters,
      fuzzyTextSearchQuery,
    );

    const [allPreviuslyFilteredProjectIncludedQuery, projectsCount] =
      await this.queryCreator.joinFilteredRelations(
        extraFiltersAppliedSearchQuery,
      );

    const appliedSortingQuery = this.queryCreator.applySorting(
      sortAttributes,
      searchTerms[0],
      allPreviuslyFilteredProjectIncludedQuery,
    );

    this.logger.debug(appliedSortingQuery.getSql());

    const projects = await appliedSortingQuery.getMany();

    return {
      projects: projects,
      projectCount: projectsCount,
      suggestedSearchTerms: suggestedSearchTerms,
    };
  }
}

export class ProjectsIdsResult {
  projectIds: Array<{ id: number }>;
  suggestedSearchTerms?: string[];
  projectCount: number;
}
