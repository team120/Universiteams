import { Exclude, Expose } from 'class-transformer';
import { ResearchDepartmentShowDto } from '../../research-department/dtos/department.show.dto';
import { EnrollmentShowDto } from '../../enrollment/dtos/enrollment.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';
import { ProjectType } from '../project.entity';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

@Exclude()
export class ProjectInListDto {
  @ExposeType(Number)
  id: number;
  @Expose()
  name: string;
  @Expose()
  type: ProjectType;
  @ExposeType(Number)
  userCount: number;
  @Expose()
  creationDate: string;
  @Expose()
  endDate: string;
  @ExposeType(Boolean)
  isDown: boolean;
  @ExposeType(ResearchDepartmentShowDto)
  researchDepartments: ResearchDepartmentShowDto[];
  @ExposeType(InterestShowDto)
  interests: InterestShowDto[];
  @ExposeType(EnrollmentShowDto)
  enrollments: EnrollmentShowDto[];
}

@Exclude()
export class ProjectSingleDto extends ProjectInListDto {}

export class ProjectsResult {
  projects: ProjectInListDto[];
  suggestedSearchTerms?: string[];
  projectCount: number;
}
