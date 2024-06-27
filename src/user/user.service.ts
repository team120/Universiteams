import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Repository } from 'typeorm';
import { UserShowDto, UsersResult } from './dtos/user.show.dto';
import { User } from './user.entity';
import { DbException } from '../utils/exceptions/exceptions';
import { UserFilters, UserFindDto } from './dtos/user.find.dto';
import { QueryCreator } from './user.query.creator';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
    private readonly queryCreator: QueryCreator,
  ) {
    this.logger.setContext(UserService.name);
  }

  async findAll(): Promise<UserShowDto[]> {
    this.logger.debug('Find users and their relations');
    const users = await this.userRepository
      .find({
        relations: [
          'userAffiliations',
          'userAffiliations.researchDepartment',
          'userAffiliations.researchDepartment.facility',
          'userAffiliations.researchDepartment.facility.institution',
          'interests',
        ],
      })
      .catch((error: Error) => {
        throw new DbException(error.message, error.stack);
      });
    this.logger.debug('Map users to dto');
    return this.entityMapper.mapArray(UserShowDto, users, {
      groups: ['admin'],
    });
  }

  async find(findOptions: UserFindDto): Promise<UsersResult> {
    const filters: UserFilters = this.entityMapper.mapValue(
      UserFilters,
      findOptions,
    );

    const query = this.queryCreator.initialQuery();
    const queryWithFilters = this.queryCreator.applyFilters(filters, query);

    this.logger.debug('SQL After applying filters');
    this.logger.debug(queryWithFilters.getSql());
    const users = await queryWithFilters.getMany().catch((err: Error) => {
      throw new DbException(err.message, err.stack);
    });
    const usersCount = await queryWithFilters.getCount();
    return {
      users: this.entityMapper.mapArray(UserShowDto, users),
      usersCount: usersCount,
    };
  }
}
