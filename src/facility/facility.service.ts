import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { DbException, NotFound } from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Repository } from 'typeorm';
import { Facility } from './facility.entity';
import { FacilityShowDto } from './dtos/facility.show.dto';
import { FacilityFindDto } from './dtos/facility.find.dto';

@Injectable()
export class FacilityService {
  constructor(
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(FacilityService.name);
  }

  async find(findOptions: FacilityFindDto): Promise<FacilityShowDto[]> {
    this.logger.debug('Find facilities');
    const facilities = await this.facilityRepository
      .find({
        where: findOptions.institutionId
          ? { institution: { id: findOptions.institutionId } }
          : {},
        skip: findOptions.offset,
        take: findOptions.limit,
        relations: ['institution'],
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
}
