import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsNumber, Min, IsEnum } from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

export enum InstitutionRelations {
  facilities = 'facilities',
  researchDepartments = 'facilities.researchDepartments',
}
@Exclude()
export class InstitutionFindDto {
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
  @IsEnum(InstitutionRelations, { each: true })
  @Expose()
  relations?: InstitutionRelations[];
}
