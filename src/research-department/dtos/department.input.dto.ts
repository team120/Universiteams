import { Exclude, Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { UserAffiliationType } from 'src/user-affiliation/user-affiliation.entity';
import { ExposeType } from 'src/utils/decorators/expose-type.decorator';

/* I believe this is not necessary. We only need IDS from the request. 
currentType for that particular research department actually does not matter while Creating a project
*/
@Exclude()
export class ResearchDepartmentInput {
  @ExposeType(Number)
  id: number;
  @IsEnum(UserAffiliationType)
  @Expose()
  currentType: UserAffiliationType;
}
