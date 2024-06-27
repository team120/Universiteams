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
      .innerJoinAndSelect('user.userAffiliations', 'affiliations')
      .innerJoinAndSelect(
        'affiliations.researchDepartment',
        'researchDepartment',
      )
      .innerJoinAndSelect('researchDepartment.facility', 'rdFacility')
      .innerJoinAndSelect('rdFacility.institution', 'institution')
      .leftJoinAndSelect('user.interests', 'interests');

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
      entitiesJoinQuery.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('interests.userId')
          .from('user_interest', 'interests')
          .where('interests.interestId IN (:...interestIds)', {
            interestIds: userFilters.interestIds,
          })
          .getQuery();
        return 'user.id IN ' + subQuery;
      });
    }

    return entitiesJoinQuery;
  }
}
