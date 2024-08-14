import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsNotEmpty, IsUrl } from 'class-validator';

@Exclude()
export class FacilityCreateDto {
  @Expose()
  @IsNotEmpty()
  name: string;
  @Expose()
  @IsNotEmpty()
  abbreviation: string;
  @Expose()
  @IsUrl()
  @IsOptional()
  web?: string;
  @Expose()
  @IsNotEmpty()
  institutionId: number;
}
