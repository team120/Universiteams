import { OmitType, PickType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { AscendingDescendingOrder } from '../../utils/sorting';

export enum UserSortByProperty {
  lastName = 'lastName',
  researchDepartment = 'researchDepartment',
  facility = 'facility',
}

@Exclude()
export class UserFindDto {
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
  @IsNumber({}, { each: true })
  @ExposeType(Number)
  interestIds?: number[];
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
  @IsOptional()
  @IsEnum(UserSortByProperty)
  @Expose()
  sortBy?: UserSortByProperty;
  @IsOptional()
  @IsEnum(AscendingDescendingOrder)
  @Expose()
  order?: AscendingDescendingOrder;
}

export class UserFilters extends OmitType(UserFindDto, [
  'limit',
  'offset',
  'sortBy',
  'limit',
]) {}
@Exclude()
export class PaginationAttributes extends PickType(UserFindDto, [
  'limit',
  'offset',
]) {}

@Exclude()
export class UserSortAttributes extends PickType(UserFindDto, [
  'sortBy',
  'order',
]) {}
