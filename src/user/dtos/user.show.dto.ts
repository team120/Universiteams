import { Exclude, Expose, Type } from 'class-transformer';
import { UserAffiliationShowDto } from '../../user-affiliation/dtos/user-affiliation.show.dto';

@Exclude()
export class UserShowDto {
  @Expose()
  id: number;
  @Expose()
  name: string;
  @Expose()
  lastName: string;
  @Expose()
  mail: string;
  @Expose()
  @Type(() => UserAffiliationShowDto)
  userAffiliations: UserAffiliationShowDto[];
}
