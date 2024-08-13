import { Exclude, Expose } from 'class-transformer';
import {
  IsOptional,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsString,
} from 'class-validator';
import { ExposeType } from 'src/utils/decorators/expose-type.decorator';
import { ProjectType } from '../project.entity';

@Exclude()
export class ProjectUpdateDto {
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

  @IsArray()
  @IsNumber({}, { each: true })
  @ExposeType(Number)
  interestsIds: number[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  @Expose()
  interestsToCreate?: string[];
}
