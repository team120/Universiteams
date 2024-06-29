import {
  Exclude,
  Expose,
  Transform,
  TransformFnParams,
} from 'class-transformer';
import { IsOptional } from 'class-validator';
import * as sanitizeHtml from 'sanitize-html';

@Exclude()
export class EnrollmentRequestDto {
  @Expose()
  @IsOptional()
  @Transform((params: TransformFnParams) => sanitizeHtml(params.value))
  message?: string;
}
