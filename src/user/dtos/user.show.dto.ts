import { Exclude, Expose, Type } from 'class-transformer';
import { UserAffiliationShowDto } from '../../user-affiliation/dtos/user-affiliation.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';
import { EnrollmentShowDto } from 'src/enrollment/dtos/enrollment.show.dto';

@Exclude()
export class UserShowDto {
  @Expose()
  id: number;
  @Expose()
  firstName: string;
  @Expose()
  lastName: string;
  @Expose()
  email: string;
  @Expose()
  @Type(() => UserAffiliationShowDto)
  userAffiliations: UserAffiliationShowDto[];
  @Expose()
  @Type(() => InterestShowDto)
  interests?: InterestShowDto[];
  @Expose()
  @Type(() => EnrollmentShowDto)
  enrollments?: EnrollmentShowDto[];
}

export class UsersResult {
  users: UserShowDto[];
  usersCount: number;
}
