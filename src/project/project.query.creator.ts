import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProjectRole } from '../enrollment/enrolment.entity';
import {
  CURRENT_DATE_SERVICE,
  ICurrentDateService,
} from '../utils/current-date';
import { BadRequest, DbException } from '../utils/exceptions/exceptions';
import {
  ProjectFilters,
  PaginationAttributes,
  ProjectSortAttributes,
  SortByProperty,
} from './dtos/project.find.dto';
import {
  Project,
  isDownColumn,
  isFavoriteColumn,
  requestStateColumn,
  requesterMessageColumn,
} from './project.entity';
import { UniqueWordsService } from './unique-words.service';
import { CurrentUserWithoutTokens } from '../auth/dtos/current-user.dto';

@Injectable()
export class QueryCreator {
  private sortBy = new Map([
    [SortByProperty.name, 'project.name'],
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
    currentUser?: CurrentUserWithoutTokens,
  ): SelectQueryBuilder<Project> {
    const relatedEntitiesJoinsQuery = query
      .innerJoin('project.researchDepartments', 'researchDepartment')
      .innerJoin('researchDepartment.facility', 'researchDepartmentFacility')
      .innerJoin(
        'researchDepartmentFacility.institution',
        'researchDepartmentInstitution',
      )
      .leftJoin('project.interests', 'interest')
      .leftJoin('project.enrollments', 'enrollment')
      .leftJoin('enrollment.user', 'user');

    if (filters.interestIds) {
      if (Array.isArray(filters.interestIds)) {
        relatedEntitiesJoinsQuery
          .andWhere(`interest.id IN (:...interestIds)`, {
            interestIds: filters.interestIds,
          })
          .groupBy('project.id')
          .having('COUNT(DISTINCT interest.id) = :interestsCount', {
            interestsCount: filters.interestIds.length,
          });
      } else {
        relatedEntitiesJoinsQuery.andWhere('interest.id = :interestId', {
          interestId: filters.interestIds,
        });
      }
    }

    if (filters.institutionId) {
      relatedEntitiesJoinsQuery.andWhere(
        `researchDepartmentInstitution.id = :researchDepartmentInstitutionId`,
        {
          researchDepartmentInstitutionId: filters.institutionId,
        },
      );
    }

    if (filters.facilityId) {
      relatedEntitiesJoinsQuery.andWhere(
        'researchDepartmentFacility.id = :researchDepartmentFacilityId',
        {
          researchDepartmentFacilityId: filters.facilityId,
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

    if (filters.isFavorite !== undefined) {
      this.logger.debug('Applying favorite filter');

      if (!currentUser) {
        throw new BadRequest('User must be provided to filter by favorite');
      }

      relatedEntitiesJoinsQuery
        .leftJoin(
          'project.favorites',
          'favorite',
          'favorite.userId = :currentUserId and favorite.projectId = project.id',
        )
        .setParameter('currentUserId', currentUser.id);

      if (filters.isFavorite === true) {
        relatedEntitiesJoinsQuery.andWhere('favorite.userId = :currentUserId', {
          currentUserId: currentUser.id,
        });
      } else {
        relatedEntitiesJoinsQuery.andWhere(
          'favorite.userId IS NULL OR favorite.userId != :currentUserId',
          {
            currentUserId: currentUser.id,
          },
        );
      }
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

    if (filters.requestState) {
      if (!currentUser) {
        throw new BadRequest(
          'User must be provided to filter by request state',
        );
      }

      relatedEntitiesJoinsQuery
        .andWhere('enrollment.userId = :currentUserId', {
          currentUserId: currentUser.id,
        })
        .andWhere('enrollment.requestState = :requestState', {
          requestState: filters.requestState,
        });
    }

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

  /**
   * First, a list of project ids is obtained from the sortedAndFilteredProjectsSubquery.
   * Then, the project count is obtained from the subqueryProjectIds.
   * Finally, the finalPaginatedQuery is created by joining the sortedAndFilteredProjectsSubquery with the subqueryProjectIds,
   * applying additional projections and joins to the finalPaginatedQuery.
   *
   * @param sortedAndFilteredProjectsSubquery - The subquery with sorted and filtered projects
   * @param paginationAttributes - The attributes for pagination
   * @param orderByClause - The clause for ordering
   * @param currentUser - The current user
   * @returns A promise that resolves to a tuple containing the final paginated query and the project count
   */
  async applyPaginationAndProjections(
    sortedAndFilteredProjectsSubquery: SelectQueryBuilder<Project>,
    paginationAttributes: PaginationAttributes,
    orderByClause?: string,
    currentUser?: CurrentUserWithoutTokens,
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
      .addSelect(
        'COALESCE(project."endDate" < :currentDate, false)',
        isDownColumn,
      )
      .setParameter('currentDate', this.currentDate.get())
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
      // Only embed users with leader or admin role
      .where(`enrollment is null OR enrollment.role = '${ProjectRole.Leader}'`)
      .orWhere(`enrollment is null OR enrollment.role = '${ProjectRole.Admin}'`)
      .orderBy('orderKey')
      .setParameters(subqueryProjectIds.getParameters());

    if (currentUser) {
      const subqueryCurrentUserData = this.initialProjectQuery()
        .select('project.id as id')
        .addSelect(
          `CASE WHEN favorite.userId = :currentUserId THEN TRUE ELSE FALSE END`,
          isFavoriteColumn,
        )
        .addSelect('enrollment.requestState', requestStateColumn)
        .addSelect('enrollment.requesterMessage', requesterMessageColumn)
        .leftJoin(
          'project.favorites',
          'favorite',
          'favorite.userId = :currentUserId',
        )
        .leftJoin(
          'project.enrollments',
          'enrollment',
          'enrollment.userId = :currentUserId',
        )
        .groupBy('project.id')
        .addGroupBy('favorite.userId')
        .addGroupBy('enrollment.requestState')
        .addGroupBy('enrollment.requesterMessage')
        .setParameter('currentUserId', currentUser.id);

      finalPaginatedQuery
        .innerJoin(
          `(${subqueryCurrentUserData.getQuery()})`,
          'currentUserData',
          'project.id = "currentUserData".id',
        )
        .addSelect(`"currentUserData"."${isFavoriteColumn}"`)
        .addSelect(`"currentUserData"."${requestStateColumn}"`)
        .addSelect(`"currentUserData"."${requesterMessageColumn}"`)
        .setParameters(subqueryCurrentUserData.getParameters());
    }

    return [finalPaginatedQuery, projectCount];
  }

  findOne(
    id: number,
    currentUser?: CurrentUserWithoutTokens,
  ): SelectQueryBuilder<Project> {
    const query = this.projectRepository
      .createQueryBuilder('project')
      .addSelect('project.description')
      .addSelect(
        'COALESCE(project."endDate" < :currentDate, false)',
        isDownColumn,
      )
      .setParameter('currentDate', this.currentDate.get())
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

    if (currentUser) {
      query
        .addSelect(
          'COALESCE(favorite.userId = :currentUserId, false)',
          isFavoriteColumn,
        )
        .addSelect('enrollment.requestState', requestStateColumn)
        .addSelect('enrollment.requesterMessage', requesterMessageColumn)
        .leftJoin(
          'project.favorites',
          'favorite',
          'favorite.userId = :currentUserId',
        )
        .setParameter('currentUserId', currentUser.id);
    }

    return query;
  }

  initialProjectQuery(): SelectQueryBuilder<Project> {
    return this.projectRepository.createQueryBuilder('project');
  }
}
