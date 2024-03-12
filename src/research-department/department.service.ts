import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { DbException } from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Repository } from 'typeorm';
import { ResearchDepartmentFindDto } from './dtos/department.find.dto';
import { ResearchDepartment } from './department.entity';
import { ResearchDepartmentShowDto } from './dtos/department.show.dto';

@Injectable()
export class ResearchDepartmentService {
  constructor(
    @InjectRepository(ResearchDepartment)
    private readonly departmentRepository: Repository<ResearchDepartment>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ResearchDepartmentService.name);
  }

  async find(
    findOptions: ResearchDepartmentFindDto,
  ): Promise<ResearchDepartmentShowDto[]> {
    this.logger.debug('Find facilities');
    const facilities = await this.departmentRepository
      .find({
        where: findOptions.facilityId
          ? { facility: { id: findOptions.facilityId } }
          : {},
        skip: findOptions.offset,
        take: findOptions.limit,
      })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    this.logger.debug('Map facilities to dto');
    return this.entityMapper.mapArray(ResearchDepartmentShowDto, facilities);
  }
}
