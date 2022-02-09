import { OmitType, PickType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
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
  @IsOptional()
  @IsEnum(ProjectType)
  @Expose()
  type?: ProjectType;
  @IsOptional()
  @IsBoolean()
  @ParseOptionalBoolean({ defaultValue: false })
  @Expose()
  isDown?: boolean;
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  researchDepartmentId?: number;
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  institutionId?: number;
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  userId?: number;
  @IsOptional()
  @IsDateString()
  @Expose()
  dateFrom?: string;
  @IsOptional()
  @IsDateString()
  @Expose()
  dateUntil?: string;
  @IsOptional()
  @IsEnum(SortByProperty)
  @Expose()
  sortBy?: SortByProperty;
  @IsOptional()
  @IsBoolean()
  @ParseOptionalBoolean()
  @Expose()
  inAscendingOrder?: boolean;
  @IsOptional()
  @IsNumber()
  @Min(0)
  @ExposeType(Number)
  offset?: number;
  @IsOptional()
  @IsNumber()
  @Min(1)
  @ExposeType(Number)
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
