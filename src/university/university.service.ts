import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { DbException } from '../exceptions/database.exception';
import { EntityMapperService } from '../serialization/entity-mapper.service';
import { UniversityShowDto } from './dtos/university.show.dto';
import { University } from './university.entity';

@Injectable()
export class UniversityService {
  constructor(
    @InjectRepository(University)
    private readonly universityRepository: Repository<University>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {}

  async findAll(): Promise<UniversityShowDto[]> {
    this.logger.debug('Find all universities and their related departments');
    const universities = await this.universityRepository
      .find({ relations: ['departments'] })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    this.logger.debug('Map universities to dto');
    return this.entityMapper.mapArray(UniversityShowDto, universities);
  }
}
