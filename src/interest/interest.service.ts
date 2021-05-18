import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { DbException } from '../utils/exceptions/database.exception';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { InterestShowDto } from './dtos/interest.show.dto';
import { Interest } from './interest.entity';

@Injectable()
export class InterestService {
  constructor(
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {}

  async findAll(): Promise<InterestShowDto[]> {
    this.logger.debug('Find all interests');
    const interests = await this.interestRepository
      .find({ relations: ['projects', 'users'] })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    this.logger.debug('Map interests to dto');
    return this.entityMapper.mapArray(InterestShowDto, interests);
  }
}
