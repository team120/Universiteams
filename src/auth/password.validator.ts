import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export const IsValidPassword =
  (validationOptions?: ValidationOptions) =>
  // eslint-disable-next-line @typescript-eslint/ban-types
  (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'IsAfter',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: string) {
          const newLocal =
            /\W+/gm.test(value) &&
            /\d+/gm.test(value) &&
            /[a-z]+/gm.test(value) &&
            /[A-Z]/gm.test(value);
          return newLocal;
        },
        defaultMessage(validationArguments?: ValidationArguments) {
          const startingMessage = `${validationArguments.property} must include at least: `;
          const validationErrors = new Array<string>();

          if (!/[a-z]+/gm.test(validationArguments.value))
            validationErrors.push('one lowercase alphabetic character');
          if (!/[A-Z]/gm.test(validationArguments.value))
            validationErrors.push('one uppercase alphabetic character');
          if (!/\d+/gm.test(validationArguments.value))
            validationErrors.push('one number');
          if (!/\W+/gm.test(validationArguments.value))
            validationErrors.push('one non-alphanumeric character (#,$,%,etc)');

          return startingMessage.concat(validationErrors.join(', '));
        },
      },
    });
  };
