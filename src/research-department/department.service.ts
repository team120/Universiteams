import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import { DbException, NotFound } from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { Repository } from 'typeorm';
import { ResearchDepartmentFindDto } from './dtos/department.find.dto';
import { ResearchDepartment } from './department.entity';
import {
  DepartmentCreatedShowDto,
  ResearchDepartmentShowDto,
} from './dtos/department.show.dto';
import { ResearchDepartmentCreateDto } from './dtos/department.create.dto';
import { ResearchDepartmentUpdateDto } from './dtos/department.update.dto';

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
    this.logger.debug('Find research departments');
    const facilities = await this.departmentRepository
      .find({
        where: findOptions.facilityId
          ? { facility: { id: findOptions.facilityId } }
          : {},
        relations: ['facility', 'projects'],
        skip: findOptions.offset,
        take: findOptions.limit,
      })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    return this.entityMapper.mapArray(ResearchDepartmentShowDto, facilities);
  }

  async findById(departmentId: number): Promise<ResearchDepartmentShowDto> {
    this.logger.debug('Find RD by id');
    const department = await this.departmentRepository
      .findOne({
        relations: ['facility', 'projects'],
        where: { id: departmentId },
      })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    if (!department) {
      throw new NotFound('Research Department not found');
    }
    return this.entityMapper.mapValue(ResearchDepartmentShowDto, department);
  }

  async create(
    createDto: ResearchDepartmentCreateDto,
  ): Promise<DepartmentCreatedShowDto> {
    this.logger.debug('Create a new research department');
    const department = this.entityMapper.mapValue(
      ResearchDepartment,
      createDto,
    );
    const createdDepartment = await this.departmentRepository
      .save(department)
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    return this.entityMapper.mapValue(
      DepartmentCreatedShowDto,
      createdDepartment,
    );
  }

  async delete(departmentId: number): Promise<void> {
    this.logger.debug('Delete a research department');
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });
    if (!department)
      throw new NotFound('El ID no coincide con ningun Research Department');
    await this.departmentRepository.delete(departmentId).catch((err: Error) => {
      throw new DbException(err.message, err.stack);
    });
    this.logger.debug(
      `Research Department #${department.id} successfully deleted`,
    );
  }

  async update(
    departmentId: number,
    departmentDto: ResearchDepartmentUpdateDto,
  ) {
    this.logger.debug('Update a research department');
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });
    if (!department)
      throw new NotFound('El ID no coincide con ningun Research Department');
    await this.departmentRepository.update(departmentId, departmentDto);
    this.logger.debug(
      `Research Department #${department.id} successfully updated`,
    );
  }
}
