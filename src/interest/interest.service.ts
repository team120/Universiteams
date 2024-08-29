import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import {
  BadRequest,
  DbException,
  NotFound,
} from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { InterestShowDto } from './dtos/interest.show.dto';
import { Interest } from './interest.entity';
import { InterestFindDto } from './dtos/interest.find.dto';
import { InterestCreateDto } from './dtos/interest.create.dto';

@Injectable()
export class InterestService {
  constructor(
    @InjectRepository(Interest)
    private readonly interestRepository: Repository<Interest>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InterestService.name);
  }

  async find(findOptions: InterestFindDto): Promise<InterestShowDto[]> {
    this.logger.debug('Find interests');
    const interests = await this.interestRepository
      .find({
        take: findOptions.limit,
        skip: findOptions.offset,
        relations: ['projects', 'users'],
      })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    this.logger.debug('Map interests to dto');
    return this.entityMapper.mapArray(InterestShowDto, interests);
  }

  async delete(interestId: number): Promise<void> {
    this.logger.debug('Delete an interest');
    const interest = await this.interestRepository
      .findOne({
        where: { id: interestId },
      })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    if (!interest) throw new NotFound('Interés no encontrado');
    await this.interestRepository.delete(interestId).catch((err: Error) => {
      throw new DbException(err.message, err.stack);
    });
    this.logger.debug(`Interest #${interest.id} successfully deleted`);
  }

  async create(createDto: InterestCreateDto): Promise<InterestShowDto> {
    this.logger.debug('Create a new interest');
    const interest = this.entityMapper.mapValue(Interest, createDto);
    const existingInterest = await this.interestRepository.findOne({
      where: { name: interest.name },
    });
    if (existingInterest) {
      throw new BadRequest('Ya existe una interes con ese nombre');
    }
    const createdInterest = await this.interestRepository
      .save(interest)
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    return this.entityMapper.mapValue(InterestShowDto, createdInterest);
  }
}
