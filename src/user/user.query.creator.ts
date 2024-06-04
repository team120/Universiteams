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
    this.logger.debug('Applying filters');
    if (Array.isArray(userFilters.interestIds)) {
      query.innerJoinAndSelect(
        'user.interests',
        'interest',
        'interest.id IN (:...ids)',
        { ids: userFilters.interestIds },
      );
    } else {
      query
        .innerJoinAndSelect('user.interests', 'interest')
        .andWhere('interest.id = :id', {
          id: userFilters.interestIds,
        });
    }
    // Discuss business logic: if we want to return users with partial and exact interests OR only those matching
    // the exact same interests that are passed as parameter in request (e.g. interests 4 and 7).
    return query;
  }
}
