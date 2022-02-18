import { Exclude, Expose, Type } from 'class-transformer';
import { UserAffiliationShowDto } from '../../user-affiliation/dtos/user-affiliation.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';

@Exclude()
export class UserShowDto {
  @Expose()
  id: number;
  @Expose()
  firstName: string;
  @Expose()
  lastName: string;
  @Expose()
  mail: string;
  @Expose()
  @Type(() => UserAffiliationShowDto)
  userAffiliations: UserAffiliationShowDto[];
  @Expose()
  @Type(() => InterestShowDto)
  interests?: InterestShowDto[];
}
