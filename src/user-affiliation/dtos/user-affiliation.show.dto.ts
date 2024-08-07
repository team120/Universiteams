import { Exclude, Expose, Type } from 'class-transformer';
import { ResearchDepartmentShowDto } from '../../research-department/dtos/department.show.dto';
import { UserShowDto } from '../../user/dtos/user.show.dto';
import { UserAffiliationType } from '../user-affiliation.entity';

@Exclude()
export class UserAffiliationShowDto {
  @Expose()
  @Type(() => UserShowDto)
  user: UserShowDto;
  @Expose()
  @Type(() => ResearchDepartmentShowDto)
  researchDepartment: ResearchDepartmentShowDto;
  @Expose()
  currentType: UserAffiliationType;
  @Expose({ groups: ['admin'] })
  requestedType: UserAffiliationType;
}
