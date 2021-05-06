import { Exclude, Expose, Type } from 'class-transformer';
import { InstitutionShowDto } from '../../institution/dtos/institution.show.dto';
import { ResearchDepartmentShowDto } from '../../research-department/dtos/research-department.show.dto';

@Exclude()
export class FacilityShowDto {
  @Expose()
  @Type(() => Number)
  id: number;
  @Expose()
  name: string;
  @Expose()
  abbreviation: string;

  @Expose()
  @Type(() => InstitutionShowDto)
  institution: InstitutionShowDto;

  @Expose()
  @Type(() => ResearchDepartmentShowDto)
  researchDepartments: ResearchDepartmentShowDto[];
}
