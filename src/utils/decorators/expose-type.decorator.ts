import { applyDecorators } from '@nestjs/common';
import { Expose, Type } from 'class-transformer';
import { Type as GenericType } from '../generic-type';

export const ExposeType = <T>(type: GenericType<T>) =>
  applyDecorators(
    Expose(),
    Type(() => type),
  );
