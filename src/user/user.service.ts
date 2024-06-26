import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Repository } from 'typeorm';
import { UserShowDto } from './dtos/user.show.dto';
import { User } from './user.entity';
import { DbException, NotFound } from '../utils/exceptions/exceptions';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
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
