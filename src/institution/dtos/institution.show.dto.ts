import { Exclude, Expose } from 'class-transformer';
import { ResearchDepartmentShowDto } from '../../research-department/dtos/research-department.show.dto';

@Exclude()
export class InstitutionShowDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  researchDepartments: ResearchDepartmentShowDto;
}
