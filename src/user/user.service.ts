import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppLogger } from 'src/logger/app-logger';
import { EntityMapperService } from 'src/shared/entity-mapper/entity-mapper.service';
import { Repository } from 'typeorm';
import { UserShowDto } from './dtos/user.show.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private entityMapper: EntityMapperService,
    private logger: AppLogger,
  ) {
    this.logger.setContext(UserService.name);
  }

  async findAll(): Promise<UserShowDto[]> {
    this.logger.debug('Find users');
    const users = await this.userRepository.find({ relations: ['university'] });
    this.logger.debug('Map users to dto');
    return this.entityMapper.mapArray(UserShowDto, users, {
      groups: ['admin'],
    });
  }
}
