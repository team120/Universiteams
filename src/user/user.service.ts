import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { EntityMapperService } from '../serialization/entity-mapper.service';
import { Repository } from 'typeorm';
import { UserAdminViewDto } from './dtos/user.show.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(UserService.name);
  }

  async findAll(): Promise<UserAdminViewDto[]> {
    this.logger.debug('Find users and their related university');
    const users = await this.userRepository.find({ relations: ['university'] });
    this.logger.debug('Map users to dto');
    return this.entityMapper.mapArray(UserAdminViewDto, users);
  }
}
