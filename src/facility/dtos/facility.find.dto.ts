import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

export enum FacilityRelations {
  researchDepartments = 'researchDepartments',
  institution = 'institution',
}
@Exclude()
export class FacilityFindDto {
  @IsOptional()
  @IsNumber()
  @ExposeType(Number)
  institutionId?: number;
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
  @IsEnum(FacilityRelations, { each: true })
  @Expose()
  relations?: FacilityRelations[];
}
