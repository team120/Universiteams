import { Exclude, Expose } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { UserAffiliationType } from 'src/user-affiliation/user-affiliation.entity';
import { ExposeType } from 'src/utils/decorators/expose-type.decorator';

@Exclude()
export class ResearchDepartmentInput {
  @ExposeType(Number)
  id: number;
  @IsEnum(UserAffiliationType)
  @Expose()
  currentType: UserAffiliationType;
}
