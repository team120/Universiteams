import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProjectRole } from '../enrollment/enrolment.entity';
import {
  CURRENT_DATE_SERVICE,
  ICurrentDateService,
} from '../utils/current-date';
import { DbException } from '../utils/exceptions/exceptions';
import {
  ProjectFilters,
  PaginationAttributes,
  ProjectSortAttributes,
  SortByProperty,
} from './dtos/project.find.dto';
import { Project } from './project.entity';
import { UniqueWordsService } from './unique-words.service';

@Injectable()
export class QueryCreator {
  private sortBy = new Map([
    [SortByProperty.name, 'project.name'],
    [SortByProperty.researchDepartment, 'researchDepartment.name'],
    [SortByProperty.facility, 'researchDepartmentFacility.name'],
    [SortByProperty.creationDate, 'project.creationDate'],
  ]);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly uniqueWordsService: UniqueWordsService,
    private readonly logger: PinoLogger,
    @Inject(CURRENT_DATE_SERVICE)
    private readonly currentDate: ICurrentDateService,
  ) {
    this.logger.setContext(QueryCreator.name);
  }

  applyTextSearch(filters: ProjectFilters, query: SelectQueryBuilder<Project>) {
    const searchQuery = query.innerJoin(
      'project_search_index',
      'p_index',
      'p_index.id = project.id',
    );

    if (!filters.generalSearch) return query;

    const fullTextSearchConversion = filters.generalSearch
      .replace(/\s/g, ':* & ')
      .concat(':*');

    searchQuery.where(
      `p_index.document_with_weights @@ to_tsquery(project.language::regconfig, unaccent(:generalSearch))`,
      {
        generalSearch: fullTextSearchConversion,
      },
    );

    return searchQuery;
  }

  async applyFuzzyTextSearch(
    filters: ProjectFilters,
    query: SelectQueryBuilder<Project>,
  ): Promise<[SelectQueryBuilder<Project>, string[]?]> {
    if (!filters.generalSearch) return [query, undefined];

    const projectsCountNormalSearch = await query
      .getCount()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    if (projectsCountNormalSearch !== 0) return [query, undefined];

    const matchingWords = await this.uniqueWordsService.getMatchingWords(
      filters.generalSearch,
    );

    const fuzzySearchQuery = this.projectRepository
      .createQueryBuilder('project')
      .innerJoin('project_search_index', 'p_index', 'p_index.id = project.id')
      .where(
        `p_index.document_with_weights @@ to_tsquery(project.language::regconfig, unaccent(:generalSearch))`,
        {
          generalSearch: matchingWords[0].replace(/\s/g, ' & '),
        },
      );

    return [fuzzySearchQuery, matchingWords];
  }

  applyExtraFilters(
    filters: ProjectFilters,
    query: SelectQueryBuilder<Project>,
  ): SelectQueryBuilder<Project> {
    const relatedEntitiesJoinsQuery = query
      .innerJoin('project.researchDepartments', 'researchDepartment')
      .innerJoin('researchDepartment.facility', 'researchDepartmentFacility')
      .innerJoin(
        'researchDepartmentFacility.institution',
        'researchDepartmentInstitution',
      )
      .leftJoin('project.enrollments', 'enrollment')
      .leftJoin('enrollment.user', 'user')
      .leftJoin('user.userAffiliations', 'userAffiliation')
      .leftJoin('userAffiliation.researchDepartment', 'userResearchDepartment')
      .leftJoin('userResearchDepartment.facility', 'userFacility')
      .leftJoin('userFacility.institution', 'userInstitution');

    if (filters.institutionId) {
      relatedEntitiesJoinsQuery.andWhere(
        `userInstitution.id = :userInstitutionId`,
        {
          userInstitutionId: filters.institutionId,
        },
      );
    }
    if (filters.researchDepartmentId) {
      relatedEntitiesJoinsQuery.andWhere(
        'researchDepartment.id = :researchDepartmentId',
        {
          researchDepartmentId: filters.researchDepartmentId,
        },
      );
    }
    if (filters.type) {
      relatedEntitiesJoinsQuery.andWhere('project.type = :type', {
        type: filters.type,
      });
    }
    if (filters.isDown !== undefined) {
      if (filters.isDown === false)
        relatedEntitiesJoinsQuery.andWhere(
          'COALESCE(project."endDate" >= :currentDate, true)',
          {
            currentDate: this.currentDate.get(),
          },
        );
      if (filters.isDown === true)
        relatedEntitiesJoinsQuery.andWhere(
          'COALESCE(project."endDate" < :currentDate, false)',
          {
            currentDate: this.currentDate.get(),
          },
        );
    }
    if (filters.userId) {
      relatedEntitiesJoinsQuery.andWhere('user.id = :userId', {
        userId: filters.userId,
      });
    }
    if (filters.dateFrom) {
      relatedEntitiesJoinsQuery.andWhere(
        'project."creationDate" BETWEEN :dateFrom AND :currentDate',
        {
          dateFrom: filters.dateFrom,
          currentDate: this.currentDate.get(),
        },
      );
    }
    if (filters.dateUntil) {
      relatedEntitiesJoinsQuery.andWhere(
        'COALESCE(project."endDate" < :dateUntil, false)',
        {
          dateUntil: filters.dateUntil,
        },
      );
    }
    this.logger.debug(relatedEntitiesJoinsQuery.getSql());

    return relatedEntitiesJoinsQuery;
  }

  applySorting(
    sortAttributes: ProjectSortAttributes,
    query: SelectQueryBuilder<Project>,
  ): [SelectQueryBuilder<Project>, string] {
    if (!sortAttributes.sortBy) return [query, undefined];

    const sortByProperty = this.sortBy.get(sortAttributes.sortBy);

    if (!sortByProperty) return [query, undefined];

    const orderDirection =
      sortAttributes.inAscendingOrder === true ? 'ASC' : 'DESC';
    const orderByClause = `${sortByProperty} ${orderDirection}`;
    this.logger.debug(orderByClause);
    return [query.orderBy(sortByProperty, orderDirection), orderByClause];
  }

  async applyPagination(
    sortedAndFilteredProjectsSubquery: SelectQueryBuilder<Project>,
    paginationAttributes: PaginationAttributes,
    orderByClause?: string,
  ): Promise<[SelectQueryBuilder<Project>, number]> {
    const subqueryProjectIds = sortedAndFilteredProjectsSubquery
      .select(
        `project.id as id, row_number() over (${
          orderByClause ? 'ORDER BY ' + orderByClause : ''
        }) as orderKey`,
      )
      .groupBy('project.id')
      .offset(paginationAttributes.offset)
      .limit(paginationAttributes.limit);
    const projectCount = await subqueryProjectIds
      .getCount()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    const finalPaginatedQuery = this.projectRepository
      .createQueryBuilder('project')
      .innerJoin(
        `(${subqueryProjectIds.getQuery()})`,
        'projectIds',
        'project.id = "projectIds".id',
      )
      .innerJoinAndSelect('project.researchDepartments', 'researchDepartment')
      .innerJoinAndSelect(
        'researchDepartment.facility',
        'researchDepartmentFacility',
      )
      .innerJoinAndSelect(
        'researchDepartmentFacility.institution',
        'researchDepartmentInstitution',
      )
      .leftJoinAndSelect('project.interests', 'projectInterests')
      .leftJoinAndSelect('project.enrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.user', 'user')
      .where(`enrollment is null OR enrollment.role = '${ProjectRole.Leader}'`)
      .orWhere(`enrollment is null OR enrollment.role = '${ProjectRole.Admin}'`)
      .orderBy('orderKey')
      .setParameters(subqueryProjectIds.getParameters());

    return [finalPaginatedQuery, projectCount];
  }

  findOne(id: number): SelectQueryBuilder<Project> {
    return this.projectRepository
      .createQueryBuilder('project')
      .innerJoinAndSelect('project.researchDepartments', 'researchDepartment')
      .innerJoinAndSelect(
        'researchDepartment.facility',
        'researchDepartmentFacility',
      )
      .innerJoinAndSelect(
        'researchDepartmentFacility.institution',
        'researchDepartmentInstitution',
      )
      .leftJoinAndSelect('project.enrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.user', 'user')
      .leftJoinAndSelect('user.userAffiliations', 'userAffiliation')
      .leftJoinAndSelect(
        'userAffiliation.researchDepartment',
        'userResearchDepartment',
      )
      .leftJoinAndSelect('userResearchDepartment.facility', 'userFacility')
      .leftJoinAndSelect('userFacility.institution', 'userInstitution')
      .leftJoinAndSelect('project.interests', 'interests')
      .where('project.id = :projectId', { projectId: id });
  }

  initialProjectQuery(): SelectQueryBuilder<Project> {
    return this.projectRepository.createQueryBuilder('project');
  }
}
