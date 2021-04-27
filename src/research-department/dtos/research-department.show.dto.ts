import { Exclude, Expose, Type } from 'class-transformer';
import { InstitutionShowDto } from '../../institution/dtos/institution.show.dto';

@Exclude()
export class ResearchDepartmentShowDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  @Type(() => InstitutionShowDto)
  institution: InstitutionShowDto;
}
