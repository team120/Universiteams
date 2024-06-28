import { OmitType, PickType } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { ExposeType } from 'src/utils/decorators/expose-type.decorator';

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
  // TO-DO:  SORT BY
}

export class UserFilters extends OmitType(UserFindDto, ['limit', 'offset']) {}
// Will be adding sortBy, limit, offset, etc
// When sorting and pagination is implemented

@Exclude()
export class PaginationAttributes extends PickType(UserFindDto, [
  'limit',
  'offset',
]) {}
