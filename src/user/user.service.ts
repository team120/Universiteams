import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToClass } from 'class-transformer';
import { EntityMapperService } from 'src/shared/entity-mapper/entity-mapper.service';
import { Repository } from 'typeorm';
import { UserShowDto } from './dtos/user.show.dto';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    private entityMapper: EntityMapperService,
  ) {}

  async findAll(): Promise<UserShowDto[]> {
    const users = await this.userRepository.find({ relations: ['university'] });
    return this.entityMapper.mapArray(UserShowDto, users, {
      groups: ['admin'],
    });
  }
}
