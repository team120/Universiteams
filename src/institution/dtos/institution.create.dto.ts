import {
  Exclude,
  Expose,
  Transform,
  TransformFnParams,
} from 'class-transformer';
import { IsOptional } from 'class-validator';
import * as sanitizeHtml from 'sanitize-html';

@Exclude()
export class InstitutionCreateDto {
  @Expose()
  @Transform((params: TransformFnParams) => sanitizeHtml(params.value))
  name: string;
  @Transform((params: TransformFnParams) => sanitizeHtml(params.value))
  abbreviation?: string;
  @IsOptional()
  @Transform((params: TransformFnParams) => sanitizeHtml(params.value))
  web?: string;
}
