import { Exclude, Expose } from 'class-transformer';
import { ProjectLanguage, ProjectType } from '../project.entity';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { IsOptional } from 'class-validator';
import { EnrollmentSimpleShowDto } from '../../enrollment/dtos/enrollment.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';
import { DepartmentSimpleShowDto } from '../../research-department/dtos/department.show.dto';

@Exclude()
export class ProjectShowCreatedDto {
  @ExposeType(Number)
  id: number;
  @Expose()
  name: string;
  @Expose()
  type: ProjectType;
  @Expose()
  language: ProjectLanguage;
  @Expose()
  @IsOptional()
  description?: string;
  @Expose()
  creationDate: string;
  @Expose()
  @IsOptional()
  endDate?: string;
  @Expose()
  @IsOptional()
  web?: string;
  @ExposeType(DepartmentSimpleShowDto)
  researchDepartments: DepartmentSimpleShowDto[];
  @ExposeType(InterestShowDto)
  interests: InterestShowDto[];
  @ExposeType(EnrollmentSimpleShowDto)
  enrollments: EnrollmentSimpleShowDto[];
}
