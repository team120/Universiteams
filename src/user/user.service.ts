import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from 'src/exceptions/database.exception';
import { EntityMapperService } from 'src/shared/entity-mapper/entity-mapper.service';
import { Repository } from 'typeorm';
import { UserShowDto } from './dtos/user.show.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
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

  async findOne(id: number): Promise<UserShowDto> {
    const user = await this.userRepository
      .findOneOrFail(id, { relations: ['university'] })
      .catch(() => {
        throw new DbException();
      });

    if (!user) throw new NotFoundException();

    return this.entityMapper.mapValue(UserShowDto, user);
  }
}
