import { Exclude, Expose } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { UserAffiliationShowDto } from '../../user-affiliation/dtos/user-affiliation.show.dto';
import { InterestShowDto } from '../../interest/dtos/interest.show.dto';
import { ResearchDepartmentInput } from 'src/research-department/dtos/department.input.dto';

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
