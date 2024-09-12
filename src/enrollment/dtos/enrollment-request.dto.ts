import {
  Exclude,
  Expose,
  Transform,
  TransformFnParams,
} from 'class-transformer';
import { IsOptional } from 'class-validator';
import * as sanitizeHtml from 'sanitize-html';
import { ExposeType } from '../../utils/decorators/expose-type.decorator';

@Exclude()
export class EnrollmentRequestDto {
  @Expose()
  @IsOptional()
  @Transform((params: TransformFnParams) => sanitizeHtml(params.value))
  message?: string;
}

@Exclude()
export class EnrollmentRequestFromRequesterDto {
  @Expose()
  @IsOptional()
  @Transform((params: TransformFnParams) => sanitizeHtml(params.value))
  message?: string;
  @ExposeType(Number)
  projectId: number;
}
