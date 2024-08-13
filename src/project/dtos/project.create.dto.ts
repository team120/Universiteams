import { Exclude, Expose } from 'class-transformer';
import {
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsString,
} from 'class-validator';
import { ResearchDepartmentInput } from 'src/research-department/dtos/department.input.dto';
import { ExposeType } from 'src/utils/decorators/expose-type.decorator';
import { ProjectType } from '../project.entity';

@Exclude()
export class ProjectCreateDto {
  @Expose()
  @IsNotEmpty()
  name: string;
  @Expose()
  @IsNotEmpty()
  type: ProjectType;
  @IsNotEmpty()
  language: 'spanish' | 'english';
  @Expose()
  @IsOptional()
  description?: string;
  @Expose()
  @IsOptional()
  endDate?: string;
  @Expose()
  @IsOptional()
  web?: string;
  @Expose()
  @IsOptional()
  requesterMessage?: string;
  @Expose()
  @IsNotEmpty()
  userCreatorId: number;

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
