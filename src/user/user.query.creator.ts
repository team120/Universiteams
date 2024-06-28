import { Injectable } from '@nestjs/common';
import { User } from './user.entity';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { EntityQueryCreator } from 'src/utils/query.creator';
import { UserFilters } from './dtos/user.find.dto';

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

  applyFilters(
    userFilters: UserFilters,
    query: SelectQueryBuilder<User>,
  ): SelectQueryBuilder<User> {
    this.logger.debug('SQL Before applying filters');
    this.logger.debug(query.getSql());
    const entitiesJoinQuery = query
      .select('user.id', 'id')
      .innerJoin('user.userAffiliations', 'affiliations')
      .innerJoin('affiliations.researchDepartment', 'researchDepartment')
      .innerJoin('researchDepartment.facility', 'rdFacility')
      .innerJoin('rdFacility.institution', 'institution')
      .innerJoin('user.interests', 'interest')
      .groupBy('user.id');

    if (userFilters.institutionId) {
      entitiesJoinQuery.andWhere(`institution.id = :institutionId`, {
        institutionId: userFilters.institutionId,
      });
    }

    if (userFilters.facilityId) {
      entitiesJoinQuery.andWhere('rdFacility.id = :rdFacilityId', {
        rdFacilityId: userFilters.facilityId,
      });
    }

    if (userFilters.researchDepartmentId) {
      entitiesJoinQuery.andWhere(
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
      entitiesJoinQuery
        .andWhere(`interest.id IN (:...interestIds)`, {
          interestIds: interestsIds,
        })
        .having('COUNT(DISTINCT interest.id) = :interestCount', {
          interestCount: interestsIds.length,
        });
    }

    return entitiesJoinQuery;
  }

  applyProjections(
    filteredQuery: SelectQueryBuilder<User>,
  ): SelectQueryBuilder<User> {
    const projectionsQuery = this.initialQuery()
      .innerJoin(
        `(${filteredQuery.getQuery()})`,
        'userIds',
        'user.id = "userIds".id',
      )
      .innerJoinAndSelect('user.userAffiliations', 'affiliations')
      .innerJoinAndSelect(
        'affiliations.researchDepartment',
        'researchDepartment',
      )
      .innerJoinAndSelect('researchDepartment.facility', 'rdFacility')
      .innerJoinAndSelect('rdFacility.institution', 'institution')
      .innerJoinAndSelect('user.interests', 'interests')
      .setParameters(filteredQuery.getParameters());

    return projectionsQuery;
  }
}
