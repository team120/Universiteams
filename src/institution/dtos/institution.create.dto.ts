import { Exclude, Expose } from 'class-transformer';
import { IsOptional, IsNotEmpty } from 'class-validator';

@Exclude()
export class InstitutionCreateDto {
  @Expose()
  @IsNotEmpty()
  name: string;
  @Expose()
  @IsNotEmpty()
  abbreviation: string;
  @Expose()
  @IsOptional()
  web?: string;
}
