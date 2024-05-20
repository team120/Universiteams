import {
  Exclude,
  Expose,
  Transform,
  TransformFnParams,
} from 'class-transformer';
import { IsOptional } from 'class-validator';
import * as sanitizeHtml from 'sanitize-html';

@Exclude()
export class EnrollmentRequestRejectDto {
  @Expose()
  @IsOptional()
  @Transform((params: TransformFnParams) => sanitizeHtml(params.value))
  message?: string;
}
