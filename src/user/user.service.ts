import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Repository } from 'typeorm';
import { UserShowDto, UsersResult } from './dtos/user.show.dto';
import { User } from './user.entity';
import {
  PaginationAttributes,
  UserFilters,
  UserFindDto,
  UserSortAttributes,
} from './dtos/user.find.dto';
import { QueryCreator } from './user.query.creator';
import { DbException, NotFound } from '../utils/exceptions/exceptions';

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
    const paginationAttributes: PaginationAttributes =
      this.entityMapper.mapValue(PaginationAttributes, findOptions);
    const sortAttributes: UserSortAttributes = this.entityMapper.mapValue(
      UserSortAttributes,
      findOptions,
    );

    const query = this.queryCreator.initialQuery();
    const queryWithFilters = this.queryCreator.applyFilters(filters, query);
    const usersCount = await queryWithFilters.getCount();
    const queryWithPagination = this.queryCreator.applyPaginations(
      queryWithFilters,
      paginationAttributes,
    );
    const queryWithProjections = this.queryCreator.applyProjectionsAndSorting(
      sortAttributes,
      queryWithPagination,
    );

    const users = await queryWithProjections.getMany().catch((err: Error) => {
      throw new DbException(err.message, err.stack);
    });

    return {
      users: this.entityMapper.mapArray(UserShowDto, users),
      usersCount: usersCount,
    };
  }

  async findOne(userId: number): Promise<UserShowDto> {
    this.logger.debug('Find a user by id and its relations');
    const user = await this.userRepository
      .findOne({
        relations: [
          'userAffiliations',
          'userAffiliations.researchDepartment',
          'userAffiliations.researchDepartment.facility',
          'userAffiliations.researchDepartment.facility.institution',
          'interests',
          'enrollments',
          'enrollments.project',
        ],
        where: { id: userId },
      })
      .catch((e: Error) => {
        throw new DbException(e.message, e.stack);
      });
    if (!user) throw new NotFound('User not found');
    return this.entityMapper.mapValue(UserShowDto, user);
  }
}
