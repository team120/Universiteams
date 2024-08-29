import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PinoLogger } from 'nestjs-pino';
import {
  BadRequest,
  DbException,
  FKConstraintException,
  NotFound,
  POSTGRES_FK_CONSTRAINT_ERROR,
} from '../utils/exceptions/exceptions';
import { EntityMapperService } from '../utils/serialization/entity-mapper.service';
import { QueryFailedError, Repository } from 'typeorm';
import { ResearchDepartmentFindDto } from './dtos/department.find.dto';
import { ResearchDepartment } from './department.entity';
import {
  DepartmentCreatedShowDto,
  ResearchDepartmentShowDto,
} from './dtos/department.show.dto';
import { ResearchDepartmentCreateDto } from './dtos/department.create.dto';
import { ResearchDepartmentUpdateDto } from './dtos/department.update.dto';
import { Facility } from '../facility/facility.entity';
import { getRelationsFromRequest } from '../utils/relations.find.dto';

@Injectable()
export class ResearchDepartmentService {
  constructor(
    @InjectRepository(ResearchDepartment)
    private readonly departmentRepository: Repository<ResearchDepartment>,
    @InjectRepository(Facility)
    private readonly facilityRepository: Repository<Facility>,
    private readonly entityMapper: EntityMapperService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ResearchDepartmentService.name);
  }

  async find(
    findOptions: ResearchDepartmentFindDto,
  ): Promise<ResearchDepartmentShowDto[]> {
    this.logger.debug('Find research departments');
    const relationsRequest = getRelationsFromRequest(findOptions);
    const departments = await this.departmentRepository
      .find({
        where: findOptions.facilityId
          ? { facility: { id: findOptions.facilityId } }
          : {},
        relations: relationsRequest,
        skip: findOptions.offset,
        take: findOptions.limit,
      })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    return this.entityMapper.mapArray(ResearchDepartmentShowDto, departments);
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
    const facility = await this.facilityRepository.findOne({
      where: { id: createDto.facilityId },
      select: ['id'],
    });
    if (!facility) throw new NotFound('Facility not found');

    const researchDepartment = this.entityMapper.mapValue(
      ResearchDepartment,
      createDto,
    );
    const existingDepartment = await this.departmentRepository.findOne({
      where: { name: researchDepartment.name },
    });
    if (existingDepartment) {
      throw new BadRequest('Ya existe un departamento con ese nombre');
    }

    const createdDepartment = await this.departmentRepository
      .save({ facility: { id: facility.id }, ...researchDepartment })
      .catch((err: Error) => {
        throw new DbException(err.message, err.stack);
      });
    return this.entityMapper.mapValue(
      DepartmentCreatedShowDto,
      createdDepartment,
    );
  }

  async delete(departmentId: number): Promise<void> {
    this.logger.debug('Delete a Research Department');
    const department = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });
    if (!department) throw new NotFound('Research Department not found');
    await this.departmentRepository
      .delete(departmentId)
      .catch((error: Error) => {
        if (error instanceof QueryFailedError) {
          if (error.driverError.code == POSTGRES_FK_CONSTRAINT_ERROR) {
            throw new FKConstraintException(
              'No se puede eliminar el departamento porque tiene proyectos asociados',
            );
          }
        }
        throw new DbException(error.message, error.stack);
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
    const researchDepartment = await this.departmentRepository.findOne({
      where: { id: departmentId },
    });
    if (!researchDepartment)
      throw new NotFound('Research Department not found');
    const existingDepartment = await this.departmentRepository.findOne({
      where: { name: departmentDto.name },
    });
    if (existingDepartment) {
      throw new BadRequest('Ya existe un departamento con ese nombre');
    }
    await this.departmentRepository.update(departmentId, departmentDto);
    this.logger.debug(
      `Research Department #${researchDepartment.id} successfully updated`,
    );
  }
}
