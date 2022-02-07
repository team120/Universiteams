import { OmitType, PickType } from '@nestjs/swagger';
import {
  Exclude,
  Expose,
  Transform,
  TransformFnParams,
  Type,
} from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { ParseOptionalBoolean } from '../../utils/decorators/parse-optional-boolean.decorator';
import { ProjectType } from '../project.entity';

export enum SortByProperty {
  name = 'name',
  researchDepartment = 'researchDepartment',
  facility = 'facility',
  creationDate = 'creationDate',
}

@Exclude()
export class ProjectFindDto {
  @Expose()
  generalSearch?: string;
  @Expose()
  type?: ProjectType;
  @Expose()
  @ParseOptionalBoolean()
  isDown?: boolean;
  @ExposeType(Number)
  researchDepartmentId?: number;
  @ExposeType(Number)
  institutionId?: number;
  @ExposeType(Number)
  userId?: number;
  @ExposeType(Date)
  dateFrom?: Date;
  @Expose()
  sortBy?: SortByProperty;
  @Expose()
  @ParseOptionalBoolean()
  inAscendingOrder?: boolean;
  @ExposeType(Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
  @ExposeType(Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

@Exclude()
export class ProjectFilters extends OmitType(ProjectFindDto, [
  'sortBy',
  'inAscendingOrder',
  'limit',
  'offset',
]) {}

@Exclude()
export class ProjectSortAttributes extends PickType(ProjectFindDto, [
  'sortBy',
  'inAscendingOrder',
]) {}

@Exclude()
export class PaginationAttributes extends PickType(ProjectFindDto, [
  'limit',
  'offset',
]) {}
