import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { isAfter } from 'date-fns';

/**
 * Checks if this date happens after the other date field (decorator argument)
 */
export const IsAfter = (
  property: string,
  validationOptions?: ValidationOptions,
) => {
  // eslint-disable-next-line @typescript-eslint/ban-types
  return (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'IsAfter',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: string, args: ValidationArguments) {
          const constraintPropertyName = args.constraints[0];
          const constraintPropertyDateString =
            args.object[constraintPropertyName];

          return isAfter(
            new Date(value),
            new Date(constraintPropertyDateString),
          );
        },
        defaultMessage(args: ValidationArguments) {
          const constraintPropertyName = args.constraints[0];

          return `${args.property} is not after ${constraintPropertyName}`;
        },
      },
    });
  };
};
