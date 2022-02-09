import { Transform, TransformFnParams } from 'class-transformer';

const optionalBooleanMapper = new Map([
  ['true', true],
  ['false', false],
]);

export const parseOptionalBooleanFunc = (
  value: any,
  defaultValue?: boolean,
): boolean | undefined => {
  const valueType = typeof value;
  if (valueType === 'boolean') return value;
  if (valueType !== 'string') return defaultValue ?? undefined;

  const rta = optionalBooleanMapper.get(value) ?? defaultValue;
  return rta;
};

export const ParseOptionalBoolean = (params?: { defaultValue: boolean }) =>
  Transform(({ value }: TransformFnParams): boolean => {
    return parseOptionalBooleanFunc(value, params?.defaultValue);
  });
