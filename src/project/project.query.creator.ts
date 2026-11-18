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
  senderNameColumn,
} from './project.entity';
import { UniqueWordsService } from './unique-words.service';
import { CurrentUserWithoutTokens } from '../auth/dtos/current-user.dto';
import { EntityQueryCreator } from '../utils/query.creator';
import { AscendingDescendingOrder } from '../utils/sorting';
import { searchWords, toTsQuery } from '../utils/full-text-search';

// Full name of the admin who invited the current user, or null
const senderNameSelect =
  "NULLIF(COALESCE(sender.\"firstName\", '') || ' ' || COALESCE(sender.\"lastName\", ''), ' ')";
// Only current admins and leaders see the request count: a kicked or
// unenrolled admin keeps the role but is no longer a member
const requestEnrollmentCountSelectFor = (enrollmentAlias: string) =>
  `CASE WHEN ${enrollmentAlias}.role IN (:...requestCountRoles) AND ${enrollmentAlias}.requestState = :requestCountState THEN project.requestEnrollmentCount ELSE NULL END`;
const requestEnrollmentCountSelect =
  requestEnrollmentCountSelectFor('enrollment');
const requestEnrollmentCountParameters = {
  requestCountRoles: [ProjectRole.Leader, ProjectRole.Admin],
  requestCountState: RequestState.Accepted,
};

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
    const searchQuery = query.leftJoin(
      'project_search_index',
      'p_index',
      'p_index.id = project.id',
    );

    const fullTextSearchConversion = toTsQuery(
      searchWords(filters.generalSearch ?? ''),
      { prefix: true },
    );
    if (!fullTextSearchConversion) return query;

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
    const words = searchWords(filters.generalSearch ?? '');
    if (words.length === 0) return [query, undefined];

    const projectsCountNormalSearch = await query
      .getCount()
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });

    if (projectsCountNormalSearch !== 0) return [query, undefined];

    const matchingWords = await this.uniqueWordsService.getMatchingWords(
      words.join(' '),
    );
    // No similar word: the search stays empty
    const fuzzySearchConversion = toTsQuery(
      searchWords(matchingWords[0] ?? ''),
      {
        prefix: false,
      },
    );
    if (!fuzzySearchConversion) return [query, undefined];

    const fuzzySearchQuery = this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project_search_index', 'p_index', 'p_index.id = project.id')
      .where(
        `p_index.document_with_weights @@ to_tsquery(project.language::regconfig, unaccent(:generalSearch))`,
        {
          generalSearch: fuzzySearchConversion,
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
    // With no sortBy, the newest projects come first
    const sortBy = sortAttributes.sortBy ?? SortByProperty.creationDate;
    const orderDirection =
      sortAttributes.order ??
      (sortAttributes.sortBy
        ? AscendingDescendingOrder.ascending
        : AscendingDescendingOrder.descending);

    let sortExpression = this.sortBy.get(sortBy) ?? 'project.creationDate';
    if (sortBy === SortByProperty.requestEnrollmentCount) {
      // The count is only visible to the project's current leaders and admins
      filteredProjectsSubquery
        .leftJoin(
          'project.enrollments',
          'sortEnrollment',
          'sortEnrollment.userId = :sortUserId',
          { sortUserId: currentUser.id },
        )
        .setParameters(requestEnrollmentCountParameters);
      sortExpression = `MAX(${requestEnrollmentCountSelectFor(
        'sortEnrollment',
      )})`;
    }
    const nullsLast =
      sortBy === SortByProperty.requestEnrollmentCount ? ' NULLS LAST' : '';

    // The sort decides which projects are on the page; the id keeps pages
    // stable when the sorted values tie
    const subqueryProjectIds = filteredProjectsSubquery
      .addSelect(
        `row_number() over (
          ORDER BY ${sortExpression} ${orderDirection}${nullsLast}, project.id ${orderDirection}
        ) as ${orderKey}`,
      )
      .orderBy(orderKey)
      .offset(paginationAttributes.offset)
      .limit(paginationAttributes.limit);

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
      // Only embed current leaders and admins
      .leftJoinAndSelect(
        'project.enrollments',
        'enrollment',
        'enrollment.role IN (:...embeddedRoles) AND enrollment.requestState = :embeddedState',
        {
          embeddedRoles: [ProjectRole.Leader, ProjectRole.Admin],
          embeddedState: RequestState.Accepted,
        },
      )
      .leftJoinAndSelect('enrollment.user', 'user')
      .setParameters(subqueryProjectIds.getParameters());

    if (currentUser) {
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
        .addSelect(senderNameSelect, senderNameColumn)
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
        .leftJoin('enrollment.sender', 'sender')
        .groupBy('project.id')
        .addGroupBy('favorite.userId')
        .addGroupBy('enrollment.requestState')
        .addGroupBy('enrollment.requesterMessage')
        .addGroupBy('enrollment.adminMessage')
        .addGroupBy('enrollment.role')
        .addGroupBy('sender."firstName"')
        .addGroupBy('sender."lastName"')
        .setParameter('currentUserId', currentUser.id)
        .setParameters(requestEnrollmentCountParameters);

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
        .addSelect(`"currentUserData"."${senderNameColumn}"`)
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
      // A project with no interests or no members left is still shown, like
      // in the list
      .leftJoinAndSelect('project.interests', 'interests')
      .leftJoinAndSelect(
        'project.enrollments',
        'enrollment',
        'enrollment.requestState = :status',
        { status: RequestState.Accepted },
      )
      .leftJoinAndSelect('enrollment.user', 'user')
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
        .addSelect(senderNameSelect, senderNameColumn)
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
        .leftJoin('enrollment.sender', 'sender')
        .groupBy('project.id')
        .addGroupBy('favorite.userId')
        .addGroupBy('enrollment.requestState')
        .addGroupBy('enrollment.requesterMessage')
        .addGroupBy('enrollment.adminMessage')
        .addGroupBy('enrollment.role')
        .addGroupBy('sender."firstName"')
        .addGroupBy('sender."lastName"')
        .setParameter('currentUserId', currentUser.id)
        .setParameters(requestEnrollmentCountParameters);

      query
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
        .addSelect(`"currentUserData"."${senderNameColumn}"`)
        .setParameters(subqueryCurrentUserData.getParameters());
    }

    return query;
  }
}
