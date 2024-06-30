import { Exclude, Expose } from 'class-transformer';
import { ProjectRole } from '../enrollment.entity';
import { IsEnum } from 'class-validator';

@Exclude()
export class EnrollmentChangeRole {
  @Expose()
  @IsEnum(ProjectRole)
  role: ProjectRole;
}
