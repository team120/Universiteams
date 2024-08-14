import { Exclude, Expose } from 'class-transformer';
import {
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsString,
  IsEnum,
  IsDateString,
  ArrayNotEmpty,
} from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { ProjectLanguage, ProjectType } from '../project.entity';

@Exclude()
export class ProjectCreateDto {
  @Expose()
  @IsNotEmpty()
  name: string;
  @Expose()
  @IsNotEmpty()
  type: ProjectType;
  @Expose()
  @IsEnum(ProjectLanguage)
  @IsNotEmpty()
  language: ProjectLanguage;
  @Expose()
  @IsOptional()
  description?: string;
  @Expose()
  @IsOptional()
  @IsDateString()
  endDate?: string;
  @Expose()
  @IsOptional()
  web?: string;
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @ExposeType(Number)
  interestsIds: number[];
  @IsArray()
  @ArrayNotEmpty()
  @IsNumber({}, { each: true })
  @ExposeType(Number)
  researchDepartmentsIds: number[];
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  interestsToCreate?: string[];
}
