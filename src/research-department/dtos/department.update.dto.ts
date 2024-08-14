import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsUrl } from 'class-validator';

@Exclude()
export class ResearchDepartmentUpdateDto {
  @Expose()
  @IsOptional()
  name?: string;
  @Expose()
  @IsOptional()
  abbreviation?: string;
  @Expose()
  @IsUrl()
  @IsOptional()
  web?: string;
}
