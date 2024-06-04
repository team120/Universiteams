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
    const allRelatedTablesQuery = query.innerJoinAndSelect(
      'user.interests',
      'interest',
    );
    if (Array.isArray(userFilters.interestIds)) {
      allRelatedTablesQuery
        .andWhere('interest.id IN (:...ids)', {
          ids: userFilters.interestIds,
        })
        .groupBy('user.id');
    } else {
      allRelatedTablesQuery.andWhere('interest.id = :id', {
        id: userFilters.interestIds,
      });
    }
    return allRelatedTablesQuery;
  }
}
