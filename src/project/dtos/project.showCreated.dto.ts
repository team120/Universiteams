import { Exclude, Expose } from 'class-transformer';
import { ProjectType } from '../project.entity';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { IsOptional } from 'class-validator';
import { EnrollmentShowDto } from '../../enrollment/dtos/enrollment.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';
import { ResearchDepartmentShowDto } from '../../research-department/dtos/department.show.dto';

@Exclude()
export class ProjectShowCreatedDto {
  @ExposeType(Number)
  id: number;
  @Expose()
  name: string;
  @Expose()
  type: ProjectType;
  @Expose()
  language: 'spanish' | 'english';
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
  @ExposeType(ResearchDepartmentShowDto)
  researchDepartments: ResearchDepartmentShowDto[];
  @ExposeType(InterestShowDto)
  interests: InterestShowDto[];
  @ExposeType(EnrollmentShowDto)
  enrollments: EnrollmentShowDto[];
}
