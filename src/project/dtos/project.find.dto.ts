import { OmitType, PickType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  MinLength,
} from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { IsAfter } from '../../utils/decorators/is-after.validator';
import { ParseOptionalBoolean } from '../../utils/decorators/parse-optional-boolean.decorator';
import { ProjectType } from '../project.entity';
import { RequestState } from '../../enrollment/enrollment.entity';
import { AscendingDescendingOrder } from '../../utils/sorting';

export enum SortByProperty {
  name = 'name',
  researchDepartment = 'researchDepartment',
  facility = 'facility',
  creationDate = 'creationDate',
  requestEnrollmentCount = 'requestEnrollmentCount',
}

@Exclude()
export class ProjectFindDto {
  @Expose()
  @IsOptional()
  @MinLength(3)
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
  @IsBoolean()
  @ParseOptionalBoolean()
  @Expose()
  isFavorite?: boolean;
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  researchDepartmentId?: number;
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  facilityId?: number;
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  institutionId?: number;
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  userId?: number;
  @IsOptional()
  @IsEnum(RequestState, { each: true })
  @Expose()
  requestStates?: RequestState[];
  @IsOptional()
  @IsNumber({}, { each: true })
  @ExposeType(Number)
  interestIds?: number[];
  @IsOptional()
  @IsDateString()
  @Expose()
  dateFrom?: string;
  @IsOptional()
  @IsDateString()
  @IsAfter('dateFrom')
  @Expose()
  dateUntil?: string;
  @IsOptional()
  @IsEnum(SortByProperty)
  @Expose()
  sortBy?: SortByProperty;
  @IsOptional()
  @IsEnum(AscendingDescendingOrder)
  @Expose()
  order?: AscendingDescendingOrder;
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
  'order',
  'limit',
  'offset',
]) {}

@Exclude()
export class ProjectSortAttributes extends PickType(ProjectFindDto, [
  'sortBy',
  'order',
]) {}

@Exclude()
export class PaginationAttributes extends PickType(ProjectFindDto, [
  'limit',
  'offset',
]) {}
