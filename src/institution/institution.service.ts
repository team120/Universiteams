import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { DbException, NotFound } from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import {
  InstitutionCreatedShowDto,
  InstitutionShowDto,
} from './dtos/institution.show.dto';
import { Institution } from './institution.entity';
import { InstitutionFindDto } from './dtos/institution.find.dto';
import { InstitutionCreateDto } from './dtos/institution.create.dto';
import { InstitutionUpdateDto } from './dtos/institution.update.dto';
import { getRelationsFromRequest } from '../utils/relations.find.dto';

const institutionNotFoundError = new NotFound(
  'El ID no coincide con ninguna institución',
);

@Injectable()
export class InstitutionService {
  constructor(
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InstitutionService.name);
  }

  async find(findOptions: InstitutionFindDto): Promise<InstitutionShowDto[]> {
    this.logger.debug('Find universities and their related departments');
    const relationsRequest = getRelationsFromRequest(findOptions);
    const universities = await this.institutionRepository
      .find({
        take: findOptions.limit,
        skip: findOptions.offset,
        relations: relationsRequest,
      })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    this.logger.debug('Map universities to dto');
    return this.entityMapper.mapArray(InstitutionShowDto, universities);
  }

  async findById(institutionId: number): Promise<InstitutionShowDto> {
    this.logger.debug('Find institution by id');
    const institution = await this.institutionRepository
      .findOne({
        relations: ['facilities'],
        where: { id: institutionId },
      })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    if (!institution) {
      throw new NotFound('Institution not found');
    }
    return this.entityMapper.mapValue(InstitutionShowDto, institution);
  }

  async create(
    createDto: InstitutionCreateDto,
  ): Promise<InstitutionCreatedShowDto> {
    this.logger.debug('Create a new institution');
    const university = this.entityMapper.mapValue(Institution, createDto);
    const existingUniversity = await this.institutionRepository.findOne({
      where: { name: university.name },
    });
    if (existingUniversity) {
      throw new DbException('Ya existe una institución con ese nombre');
    }
    const createdUniversity = await this.institutionRepository
      .save(university)
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    return this.entityMapper.mapValue(
      InstitutionCreatedShowDto,
      createdUniversity,
    );
  }

  async delete(institutionId: number): Promise<void> {
    this.logger.debug('Delete an institution');
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId },
    });
    if (!institution) throw institutionNotFoundError;
    await this.institutionRepository
      .delete(institutionId)
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    this.logger.debug(`Institution #${institution.id} successfully deleted`);
  }

  async update(institutionId: number, institutionDto: InstitutionUpdateDto) {
    this.logger.debug('Update an institution');
    const institution = await this.institutionRepository.findOne({
      where: { id: institutionId },
    });
    if (!institution) throw institutionNotFoundError;
    await this.institutionRepository.update(institutionId, institutionDto);
    this.logger.debug(`Institution #${institution.id} successfully updated`);
  }
}
