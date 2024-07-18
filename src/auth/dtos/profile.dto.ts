import { Exclude, Expose } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { UserAffiliationShowDto } from '../../user-affiliation/dtos/user-affiliation.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';
import { UserAffiliationType } from '../../user-affiliation/user-affiliation.entity';

@Exclude()
class ResearchDepartmentInput {
  @ExposeType(Number)
  id: number;
  @IsEnum(UserAffiliationType)
  @Expose()
  currentType: UserAffiliationType;
}

@Exclude()
export class ProfileInputDto {
  @IsArray()
  @IsNumber({}, { each: true })
  @ExposeType(Number)
  interestsIds: number[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  interestsToCreate?: string[];

  @IsArray()
  @IsNumber({}, { each: true })
  @ExposeType(Number)
  researchDepartments: ResearchDepartmentInput[];
}

@Exclude()
export class ProfileOutputDto {
  @ExposeType(Number)
  id: number;
  @ExposeType(InterestShowDto)
  interests: InterestShowDto[];
  @ExposeType(UserAffiliationShowDto)
  userAffiliations: UserAffiliationShowDto[];
}
