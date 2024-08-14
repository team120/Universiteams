import { Exclude, Expose } from 'class-transformer';
import {
  IsOptional,
  IsArray,
  IsNumber,
  IsString,
  IsDateString,
} from 'class-validator';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';
import { ProjectType } from '../project.entity';

@Exclude()
export class ProjectUpdateDto {
  @Expose()
  @IsOptional()
  name?: string;
  @Expose()
  @IsOptional()
  type?: ProjectType;
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
  @IsOptional()
  @IsNumber({}, { each: true })
  @ExposeType(Number)
  interestsIds?: number[];
  @IsArray()
  @IsOptional()
  @IsNumber({}, { each: true })
  @ExposeType(Number)
  researchDepartmentsIds?: number[];
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  interestsToCreate?: string[];
}
