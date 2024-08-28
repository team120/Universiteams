import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import {
  BadRequest,
  DbException,
  NotFound,
} from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Repository } from 'typeorm';
import { Facility } from './facility.entity';
import { FacilityShowDto } from './dtos/facility.show.dto';
import { FacilityFindDto } from './dtos/facility.find.dto';
import { FacilityCreateDto } from './dtos/facility.create.dto';
import { FacilityUpdateDto } from './dtos/facility.update.dto';
import { Institution } from '../institution/institution.entity';
import { getRelationsFromRequest } from '../utils/relations.find.dto';

@Injectable()
export class FacilityService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    @InjectRepository(Institution)
    private readonly institutionRepository: Repository<Institution>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FacilityService.name);
  }

  async find(findOptions: FacilityFindDto): Promise<FacilityShowDto[]> {
    this.logger.debug('Find facilities');
    const relationsRequest = getRelationsFromRequest(findOptions);
    const facilities = await this.facilityRepository
      .find({
        where: findOptions.institutionId
          ? { institution: { id: findOptions.institutionId } }
          : {},
        skip: findOptions.offset,
        take: findOptions.limit,
        relations: relationsRequest,
      })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    this.logger.debug('Map facilities to dto');
    return this.entityMapper.mapArray(FacilityShowDto, facilities);
  }

  async findById(facilityId: number): Promise<FacilityShowDto> {
    this.logger.debug('Find facility by id');
    const facility = await this.facilityRepository
      .findOne({
        relations: ['institution', 'researchDepartments'],
        where: { id: facilityId },
      })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    if (!facility) {
      throw new NotFound('Facility not found');
    }
    return this.entityMapper.mapValue(FacilityShowDto, facility);
  }

  async create(createDto: FacilityCreateDto): Promise<FacilityCreateDto> {
    this.logger.debug('Create a new facility');
    const institution = await this.institutionRepository.findOne({
      where: { id: createDto.institutionId },
      select: ['id'],
    });
    if (!institution) throw new NotFound('Institution not found');
    const facility = this.entityMapper.mapValue(Facility, createDto);
    const existingFacility = await this.facilityRepository.findOne({
      where: { name: facility.name },
    });
    if (existingFacility) {
      throw new BadRequest('Ya existe una facilidad con ese nombre');
    }

    const createdFacility = await this.facilityRepository
      .save({ institution: { id: institution.id }, ...facility })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    return this.entityMapper.mapValue(FacilityCreateDto, createdFacility);
  }

  async delete(facilityId: number): Promise<void> {
    this.logger.debug('Delete a facility');
    const facility = await this.facilityRepository.findOne({
      where: { id: facilityId },
    });
    if (!facility) throw new NotFound('Facility not found');
    await this.facilityRepository.delete(facilityId).catch((err: Error) => {
      throw new DbException(err.message, err.stack);
    });
    this.logger.debug(`Facility #${facility.id} successfully deleted`);
  }

  async update(facilityId: number, facilityDto: FacilityUpdateDto) {
    this.logger.debug('Update an institution');
    const facility = await this.facilityRepository.findOne({
      where: { id: facilityId },
    });
    if (!facility) throw new NotFound('Facility not found');
    const existingFacility = await this.facilityRepository.findOne({
      where: { name: facilityDto.name },
    });
    if (existingFacility) {
      throw new BadRequest('Ya existe una facilidad con ese nombre');
    }
    await this.facilityRepository.update(facilityId, facilityDto);
    this.logger.debug(`Facility #${facility.id} successfully updated`);
  }
}
