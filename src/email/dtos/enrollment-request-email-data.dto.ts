import { Exclude, Expose } from 'class-transformer';
import { CurrentUserWithoutTokens } from '../../auth/dtos/current-user.dto';
import { Project } from '../../project/project.entity';
import { UserSimpleShowDto } from 'src/user/dtos/user.show.dto';

@Exclude()
export class EnrollmentRequestNotifyEmailData {
  @Expose()
  project: Project;
  @Expose()
  user: CurrentUserWithoutTokens;
}

@Exclude()
export class EnrollmentInvitationNotifyEmailData {
  @Expose()
  project: Project;
  @Expose()
  user: UserSimpleShowDto;
}
