import { Exclude, Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';

@Exclude()
export class EnrollmentRequestDto {
  @Expose()
  @IsOptional()
  message?: string;
}
