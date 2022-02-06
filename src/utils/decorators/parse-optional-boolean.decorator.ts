import { Transform, TransformFnParams } from 'class-transformer';

const optionalBooleanMapper = new Map([
  ['undefined', undefined],
  ['true', true],
  ['false', false],
]);

export const parseOptionalBooleanFunc = (value: any): boolean | undefined => {
  const valueType = typeof value;
  if (valueType === 'boolean') return value;
  if (valueType !== 'string') return undefined;

  return optionalBooleanMapper.get(value);
};

export const ParseOptionalBoolean = () =>
  Transform(({ value }: TransformFnParams): boolean => {
    return parseOptionalBooleanFunc(value);
  });
