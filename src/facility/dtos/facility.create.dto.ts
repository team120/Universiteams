import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsNotEmpty } from 'class-validator';

@Exclude()
export class FacilityCreateDto {
  @Expose()
  @IsNotEmpty()
  name: string;
  @Expose()
  @IsNotEmpty()
  abbreviation: string;
  @Expose()
  @IsOptional()
  web?: string;
  @Expose()
  @IsNotEmpty()
  institutionId: number;
}
