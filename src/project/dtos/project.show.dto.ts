import { Exclude, Expose } from 'class-transformer';
import { ResearchDepartmentShowDto } from '../../research-department/dtos/department.show.dto';
import { EnrollmentShowDto } from '../../enrollment/dtos/enrollment.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';
import { ProjectType } from '../project.entity';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { RequestState } from '../../enrollment/enrollment.entity';

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
  @ExposeType(Number)
  favoriteCount: number;
  @Expose()
  creationDate: string;
  @Expose()
  endDate: string;
  @ExposeType(Boolean)
  isDown: boolean;
  @ExposeType(Boolean)
  isFavorite?: boolean;
  @Expose()
  requestState?: RequestState;
  @Expose()
  requesterMessage?: string;
  @Expose()
  adminMessage?: string;
  @ExposeType(Number)
  requestEnrollmentCount: number;
  @ExposeType(ResearchDepartmentShowDto)
  researchDepartments: ResearchDepartmentShowDto[];
  @ExposeType(InterestShowDto)
  interests: InterestShowDto[];
  @ExposeType(EnrollmentShowDto)
  enrollments: EnrollmentShowDto[];
}

@Exclude()
export class ProjectSingleDto extends ProjectInListDto {
  @Expose()
  description: string;
}

export class ProjectsResult {
  projects: ProjectInListDto[];
  suggestedSearchTerms?: string[];
  projectCount: number;
}
