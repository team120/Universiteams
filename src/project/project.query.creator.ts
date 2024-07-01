import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ProjectRole, RequestState } from '../enrollment/enrollment.entity';
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
  adminMessageColumn,
  isDownColumn,
  isFavoriteColumn,
  requestEnrollmentCountColumn,
  requestStateColumn,
  requesterMessageColumn,
} from './project.entity';
import { UniqueWordsService } from './unique-words.service';
import { CurrentUserWithoutTokens } from '../auth/dtos/current-user.dto';
import { EntityQueryCreator } from 'src/utils/query.creator';

@Injectable()
export class QueryCreator extends EntityQueryCreator<Project> {
  private sortBy = new Map([
    [SortByProperty.name, 'project.name'],
    [SortByProperty.creationDate, 'project.creationDate'],
    [SortByProperty.requestEnrollmentCount, 'project.requestEnrollmentCount'],
  ]);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    private readonly uniqueWordsService: UniqueWordsService,
    private readonly logger: PinoLogger,
    @Inject(CURRENT_DATE_SERVICE)
    private readonly currentDate: ICurrentDateService,
  ) {
    super(projectRepository);
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
      const interestIds = Array.isArray(filters.interestIds)
        ? filters.interestIds
        : [filters.interestIds];

      relatedEntitiesJoinsQuery
        .andWhere(`interest.id IN (:...interestIds)`, {
          interestIds: interestIds,
        })
        .having('COUNT(DISTINCT interest.id) = :interestsCount', {
          interestsCount: interestIds.length,
        });
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

      if (!filters.requestStates) {
        relatedEntitiesJoinsQuery.andWhere(
          'enrollment.requestState = :status',
          { status: RequestState.Accepted },
        );
      }
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

    if (filters.requestStates) {
      if (!currentUser) {
        throw new BadRequest(
          'User must be provided to filter by request state',
        );
      }

      relatedEntitiesJoinsQuery.andWhere('enrollment.userId = :currentUserId', {
        currentUserId: currentUser.id,
      });

      const requestStates = Array.isArray(filters.requestStates)
        ? filters.requestStates
        : [filters.requestStates];

      relatedEntitiesJoinsQuery.andWhere(
        'enrollment.requestState IN (:...requestStates)',
        {
          requestStates: requestStates,
        },
      );
    }

    return relatedEntitiesJoinsQuery
      .select('project.id as id')
      .groupBy('project.id');
  }

  /**
   * First, a list of project ids is obtained from the sortedAndFilteredProjectsSubquery.
   * Then, the project count is obtained from the subqueryProjectIds.
   * Finally, the finalPaginatedQuery is created by joining the sortedAndFilteredProjectsSubquery with the subqueryProjectIds,
   * applying additional projections and joins to the finalPaginatedQuery.
   */
  applySortingAndPagination(
    filteredProjectsSubquery: SelectQueryBuilder<Project>,
    paginationAttributes: PaginationAttributes,
    sortAttributes: ProjectSortAttributes,
    currentUser?: CurrentUserWithoutTokens,
  ): SelectQueryBuilder<Project> {
    if (
      sortAttributes.sortBy === SortByProperty.requestEnrollmentCount &&
      !currentUser
    ) {
      throw new BadRequest(
        'No es posible ordenar por cantidad de solicitudes de inscripción sin un usuario autenticado.',
      );
    }

    const orderKey = 'orderKey';
    const sortByProperty = this.sortBy.get(sortAttributes.sortBy);
    const orderDirection =
      sortAttributes.inAscendingOrder === true ? 'ASC' : 'DESC';

    const subqueryProjectIds = filteredProjectsSubquery
      .offset(paginationAttributes.offset)
      .limit(paginationAttributes.limit);

    if (sortAttributes.sortBy !== SortByProperty.requestEnrollmentCount) {
      subqueryProjectIds.addSelect(
        `row_number() over (${
          sortByProperty ? `ORDER BY ${sortByProperty} ${orderDirection}` : ''
        }) as ${orderKey}`,
      );
    }

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
      .setParameters(subqueryProjectIds.getParameters());

    if (currentUser) {
      const requestEnrollmentCountSelect =
        'CASE WHEN enrollment.role IN (:...roles) THEN project.requestEnrollmentCount ELSE NULL END';
      const subqueryCurrentUserData = this.projectRepository
        .createQueryBuilder('project')
        .select('project.id as id')
        .addSelect(
          `CASE WHEN favorite.userId = :currentUserId THEN TRUE ELSE FALSE END`,
          isFavoriteColumn,
        )
        .addSelect('enrollment.requestState', requestStateColumn)
        .addSelect('enrollment.requesterMessage', requesterMessageColumn)
        .addSelect('enrollment.adminMessage', adminMessageColumn)
        .addSelect(requestEnrollmentCountSelect, requestEnrollmentCountColumn)
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
        .addGroupBy('enrollment.adminMessage')
        .addGroupBy('enrollment.role')
        .setParameter('currentUserId', currentUser.id)
        .setParameter('roles', [ProjectRole.Leader, ProjectRole.Admin]);

      if (sortAttributes.sortBy === SortByProperty.requestEnrollmentCount) {
        const nullsLast = 'NULLS LAST';

        subqueryCurrentUserData.addSelect(
          `row_number() over (
              ORDER BY ${requestEnrollmentCountSelect} ${orderDirection} ${nullsLast}
            ) as ${orderKey}`,
        );
      }

      finalPaginatedQuery
        .innerJoin(
          `(${subqueryCurrentUserData.getQuery()})`,
          'currentUserData',
          'project.id = "currentUserData".id',
        )
        .addSelect(`"currentUserData"."${isFavoriteColumn}"`)
        .addSelect(`"currentUserData"."${requestStateColumn}"`)
        .addSelect(`"currentUserData"."${requesterMessageColumn}"`)
        .addSelect(`"currentUserData"."${adminMessageColumn}"`)
        .addSelect(`"currentUserData"."${requestEnrollmentCountColumn}"`)
        .setParameters(subqueryCurrentUserData.getParameters());
    }

    finalPaginatedQuery.orderBy(orderKey);

    return finalPaginatedQuery;
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
      .innerJoinAndSelect('project.interests', 'interests')
      .innerJoinAndSelect(
        'project.enrollments',
        'enrollment',
        'enrollment.requestState = :status',
        { status: RequestState.Accepted },
      )
      .innerJoinAndSelect('enrollment.user', 'user')
      .leftJoinAndSelect('user.userAffiliations', 'userAffiliation')
      .leftJoinAndSelect(
        'userAffiliation.researchDepartment',
        'userResearchDepartment',
      )
      .leftJoinAndSelect('userResearchDepartment.facility', 'userFacility')
      .leftJoinAndSelect('userFacility.institution', 'userInstitution')
      .leftJoinAndSelect('user.interests', 'userInterests')
      .where('project.id = :projectId', { projectId: id });

    if (currentUser) {
      query
        .addSelect(
          'COALESCE(favorite.userId = :currentUserId, false)',
          isFavoriteColumn,
        )
        .addSelect('enrollment.requestState', requestStateColumn)
        .addSelect('enrollment.requesterMessage', requesterMessageColumn)
        .addSelect('enrollment.adminMessage', adminMessageColumn)
        .addSelect(
          'CASE WHEN enrollment.role IN (:...roles) THEN project.requestEnrollmentCount ELSE NULL END',
          requestEnrollmentCountColumn,
        )
        .setParameter('roles', [ProjectRole.Leader, ProjectRole.Admin])
        .leftJoin(
          'project.favorites',
          'favorite',
          'favorite.userId = :currentUserId',
        )
        .setParameter('currentUserId', currentUser.id);
    }

    return query;
  }
}
