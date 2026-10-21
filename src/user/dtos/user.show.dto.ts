import { Exclude, Expose, Type } from 'class-transformer';
import { UserAffiliationShowDto } from '../../user-affiliation/dtos/user-affiliation.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';
import { EnrollmentShowDto } from '../../enrollment/dtos/enrollment.show.dto';
import { UserSystemRole } from '../user.entity';
import { OmitType } from '@nestjs/swagger';

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
  requestEnrollmentInvitationsCount: number;
  @Expose()
  @Type(() => UserAffiliationShowDto)
  userAffiliations: UserAffiliationShowDto[];
  @Expose()
  @Type(() => InterestShowDto)
  interests?: InterestShowDto[];
  @Expose()
  @Type(() => EnrollmentShowDto)
  enrollments?: EnrollmentShowDto[];
  @Expose()
  systemRole?: UserSystemRole;
}

export class UsersResult {
  users: UserShowDto[];
  usersCount: number;
}

export class UserSimpleShowDto extends OmitType(UserShowDto, [
  'userAffiliations',
  'interests',
  'enrollments',
  'systemRole',
]) {}
