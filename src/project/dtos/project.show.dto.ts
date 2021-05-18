import { Exclude, Expose } from 'class-transformer';
import { ResearchDepartmentShowDto } from '../../research-department/dtos/research-department.show.dto';
import { EnrollmentShowDto } from '../../enrollment/dtos/enrollment.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';
import { ProjectType } from '../project.entity';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

@Exclude()
export class ProjectInListDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  type: ProjectType;
  @Expose()
  isDown: boolean;
  @ExposeType(Date)
  creationDate: Date;
  @ExposeType(ResearchDepartmentShowDto)
  researchDepartment: ResearchDepartmentShowDto;
  @ExposeType(EnrollmentShowDto)
  enrollments: EnrollmentShowDto[];
}

@Exclude()
export class ProjectSingleDto extends ProjectInListDto {
  @ExposeType(InterestShowDto)
  interests: InterestShowDto[];
}
