import { Exclude, Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';

@Exclude()
export class UnenrollDto {
  @Expose()
  @IsOptional()
  message?: string;
}
