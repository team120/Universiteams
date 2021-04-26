import { Exclude, Expose, Type } from 'class-transformer';
import { DepartmentShowDto } from '../../department/dtos/department.show.dto';
import { EnrollmentShowDto } from '../../enrollment/dtos/enrollment.show.dto';
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
  @Type(() => DepartmentShowDto)
  department: DepartmentShowDto;
  @Expose()
  @Type(() => EnrollmentShowDto)
  enrollments: EnrollmentShowDto[];
}
