import { Transform, TransformFnParams } from 'class-transformer';

const optionalBooleanMapper = new Map([
  ['undefined', undefined],
  ['true', true],
  ['false', false],
]);

export const ParseOptionalBoolean = () =>
  Transform(({ value }: TransformFnParams): boolean => optionalBooleanMapper.get(value));
