import { ApiHideProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';
import { UniversityShowDto } from 'src/university/dtos/university.show.dto';

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
  // TODO: Should display metadata of this one just for users route
  @ApiHideProperty()
  @Expose({ groups: ['admin'] })
  requestPosition: boolean;
}
