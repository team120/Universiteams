import { Exclude, Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';

@Exclude()
export class ResearchDepartmentUpdateDto {
  @Expose()
  @IsOptional()
  name?: string;
  @Expose()
  @IsOptional()
  abbreviation?: string;
  @Expose()
  @IsOptional()
  web?: string;
}
