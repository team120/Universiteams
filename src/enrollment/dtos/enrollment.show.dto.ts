import { Exclude, Expose, Type } from 'class-transformer';
import { ProjectInListDto } from '../../project/dtos/project.show.dto';
import { UserShowDto } from '../../user/dtos/user.show.dto';

@Exclude()
export class EnrollmentShowDto {
  @Expose()
  id: number;
  @Expose()
  @Type(() => UserShowDto)
  user: UserShowDto;
  @Expose()
  @Type(() => ProjectInListDto)
  project: ProjectInListDto;
}
