import { PickType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

export enum ResearchDepartmentRelations {
  facility = 'facility',
  projects = 'projects',
}
@Exclude()
export class ResearchDepartmentFindDto {
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  facilityId?: number;
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
  @IsEnum(ResearchDepartmentRelations, { each: true })
  @Expose()
  relations?: ResearchDepartmentRelations[];
}

@Exclude()
export class PaginationAttributes extends PickType(ResearchDepartmentFindDto, [
  'limit',
  'offset',
]) {}
