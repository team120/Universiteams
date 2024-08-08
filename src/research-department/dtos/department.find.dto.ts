import { PickType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

enum ResearchDepartmentRelations {
  FACILITY = 'facility',
  FACILITY_INSTITUTION = 'facility.institution',
}

@Exclude()
export class ResearchDepartmentFindDto {
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  facilityId?: number;
  @IsOptional()
  @IsEnum(ResearchDepartmentRelations, { each: true })
  @Expose()
  relations?: string[];
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
export class PaginationAttributes extends PickType(ResearchDepartmentFindDto, [
  'limit',
  'offset',
]) {}
