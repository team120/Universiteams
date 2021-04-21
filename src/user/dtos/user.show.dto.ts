import { Exclude, Expose, Type } from 'class-transformer';
import { DepartmentShowDto } from '../../department/dtos/department.show.dto';

@Exclude()
export class UserShowDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  lastName: string;
  @Expose()
  mail: string;
  //  @Expose()
  //  professorId: number;
  @Expose()
  @Type(() => DepartmentShowDto)
  department: DepartmentShowDto;
}

@Exclude()
export class UserAdminViewDto extends UserShowDto {
  @Expose()
  requestPosition: boolean;
}
