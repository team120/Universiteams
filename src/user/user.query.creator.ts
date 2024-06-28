import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { EntityQueryCreator } from 'src/utils/query.creator';
import {
  PaginationAttributes,
  UserFilters,
  UserSortAttributes,
  UserSortByProperty,
} from './dtos/user.find.dto';

@Injectable()
export class QueryCreator extends EntityQueryCreator<User> {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly logger: PinoLogger,
  ) {
    super(usersRepository);
    this.logger.setContext(QueryCreator.name);
  }

  private sortByMap = new Map([[UserSortByProperty.lastName, 'user.lastName']]);

  applyFilters(
    userFilters: UserFilters,
    query: SelectQueryBuilder<User>,
  ): SelectQueryBuilder<User> {
    this.logger.debug('SQL Before applying filters');
    this.logger.debug(query.getSql());
    const relatedEntitiesQuery = query
      .select('user.id', 'id')
      .innerJoin('user.userAffiliations', 'affiliations')
      .innerJoin('affiliations.researchDepartment', 'researchDepartment')
      .innerJoin('researchDepartment.facility', 'rdFacility')
      .innerJoin('rdFacility.institution', 'institution')
      .innerJoin('user.interests', 'interest')
      .groupBy('user.id');

    if (userFilters.institutionId) {
      relatedEntitiesQuery.andWhere(`institution.id = :institutionId`, {
        institutionId: userFilters.institutionId,
      });
    }

    if (userFilters.facilityId) {
      relatedEntitiesQuery.andWhere('rdFacility.id = :rdFacilityId', {
        rdFacilityId: userFilters.facilityId,
      });
    }

    if (userFilters.researchDepartmentId) {
      relatedEntitiesQuery.andWhere(
        'researchDepartment.id = :researchDepartmentId',
        {
          researchDepartmentId: userFilters.researchDepartmentId,
        },
      );
    }

    if (userFilters.interestIds) {
      const interestsIds = Array.isArray(userFilters.interestIds)
        ? userFilters.interestIds
        : [userFilters.interestIds];
      relatedEntitiesQuery
        .andWhere(`interest.id IN (:...interestIds)`, {
          interestIds: interestsIds,
        })
        .having('COUNT(DISTINCT interest.id) = :interestCount', {
          interestCount: interestsIds.length,
        });
    }

    return relatedEntitiesQuery;
  }

  applyPaginations(
    filteredQuery: SelectQueryBuilder<User>,
    paginationAttributes: PaginationAttributes,
  ): SelectQueryBuilder<User> {
    const paginationQuery = filteredQuery
      .limit(paginationAttributes.limit)
      .offset(paginationAttributes.offset);
    return paginationQuery;
  }

  applySorting(
    sortAttributes: UserSortAttributes,
    query: SelectQueryBuilder<User>,
  ): SelectQueryBuilder<User> {
    if (!sortAttributes.sortBy) return query;
    const sortByProperty = this.sortByMap.get(sortAttributes.sortBy);
    if (!sortAttributes.order) return query;
    const orderDirection = sortAttributes.order;

    query = query.orderBy(sortByProperty, orderDirection);
    return query;
  }

  applyProjections(
    sortAttributes: UserSortAttributes,
    query: SelectQueryBuilder<User>,
  ): SelectQueryBuilder<User> {
    const finalQuery = this.initialQuery()
      .innerJoin(`(${query.getQuery()})`, 'userIds', 'user.id = "userIds".id')
      .innerJoinAndSelect('user.userAffiliations', 'affiliations')
      .innerJoinAndSelect(
        'affiliations.researchDepartment',
        'researchDepartment',
      )
      .innerJoinAndSelect('researchDepartment.facility', 'rdFacility')
      .innerJoinAndSelect('rdFacility.institution', 'institution')
      .innerJoinAndSelect('user.interests', 'interests')
      .setParameters(query.getParameters());

    const finalQuerySorted = this.applySorting(sortAttributes, finalQuery);

    return finalQuerySorted;
  }
}
