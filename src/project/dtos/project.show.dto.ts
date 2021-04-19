import {
  Exclude,
  Expose,
  plainToClass,
  Transform,
  Type,
} from 'class-transformer';
import { DepartmentShowDto } from '../../department/dtos/department.show.dto';
import { UserShowDto } from '../../user/dtos/user.show.dto';
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
  @Expose({ name: 'enrollments' })
  @Transform(({ value }) =>
    value.map((e: any) => plainToClass(UserShowDto, e.user)),
  )
  users: UserShowDto[];
}