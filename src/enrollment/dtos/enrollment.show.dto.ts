import { Exclude, Expose, Type } from 'class-transformer';
import { ProjectInListDto } from '../../project/dtos/project.show.dto';
import {
  UserPublicDto,
  UserSimpleShowDto,
} from '../../user/dtos/user.show.dto';
import { ProjectRole } from '../enrollment.entity';
import { OmitType } from '@nestjs/swagger';

@Exclude()
export class EnrollmentShowDto {
  @Expose()
  id: number;
  @Expose()
  role: ProjectRole;
  @Expose()
  @Type(() => UserPublicDto)
  user: UserPublicDto;
  @Expose()
  @Type(() => ProjectInListDto)
  project: ProjectInListDto;
}

@Exclude()
export class EnrollmentSimpleShowDto extends OmitType(EnrollmentShowDto, [
  'project',
  'user',
]) {
  @Expose()
  user: UserSimpleShowDto;
}
