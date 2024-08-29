import { Exclude, Expose } from 'class-transformer';
import { CurrentUserWithoutTokens } from '../../auth/dtos/current-user.dto';
import { Project } from '../../project/project.entity';

@Exclude()
export class EnrollmentRequestNotifyEmailData {
  @Expose()
  project: Project;
  @Expose()
  user: CurrentUserWithoutTokens;
}
