import { Exclude, Expose, Type } from 'class-transformer';
import { UniversityShowDto } from '../../university/dtos/university.show.dto';

@Exclude()
export class UserShowDto {
  @Expose()
  name: string;
  @Expose()
  lastName: string;
  @Expose()
  mail: string;
  //  @Expose()
  //  professorId: number;
  @Expose()
  @Type(() => UniversityShowDto)
  university: UniversityShowDto;
}

@Exclude()
export class UserAdminViewDto extends UserShowDto {
  @Expose()
  requestPosition: boolean;
}
