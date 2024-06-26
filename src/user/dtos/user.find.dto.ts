import { Exclude } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';
import { ExposeType } from 'src/utils/decorators/expose-type.decorator';

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
  // TO-DO:  SORT BY, LIMIT, OFFSET
}

export class UserFilters extends UserFindDto {}
// Will be adding sortBy, limit, offset, etc
// When sorting and pagination is implemented
