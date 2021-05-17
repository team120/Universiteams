import { Exclude, Expose, Type } from 'class-transformer';
import { ResearchDepartmentShowDto } from '../../research-department/dtos/research-department.show.dto';
import { EnrollmentShowDto } from '../../enrollment/dtos/enrollment.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';
import { ProjectType } from '../project.entity';

@Exclude()
export class ProjectShowDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  type: ProjectType;
  @Expose()
  isDown: boolean;
  @Expose()
  @Type(() => Date)
  creationDate: Date;
  @Expose()
  @Type(() => ResearchDepartmentShowDto)
  researchDepartment: ResearchDepartmentShowDto;
  @Expose()
  @Type(() => EnrollmentShowDto)
  enrollments: EnrollmentShowDto[];
  @Type(() => InterestShowDto)
  interests?: InterestShowDto[];
}
