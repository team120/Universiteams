import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { Repository } from 'typeorm';
import { DbException } from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { InstitutionShowDto } from './dtos/institution.show.dto';
import { Institution } from './institution.entity';

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

  async findAll(): Promise<InstitutionShowDto[]> {
    this.logger.debug('Find all universities and their related departments');
    const universities = await this.institutionRepository
      .find({ relations: ['facilities', 'facilities.researchDepartments'] })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    this.logger.debug('Map universities to dto');
    return this.entityMapper.mapArray(InstitutionShowDto, universities);
  }
}
