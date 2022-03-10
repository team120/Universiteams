import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
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
      validator: IsValidPasswordValidator,
    });
  };

@ValidatorConstraint({ async: false })
export class IsValidPasswordValidator implements ValidatorConstraintInterface {
  private validations = (value: string) => ({
    // [\W_] https://stackoverflow.com/questions/35942067/why-cant-the-underscore-be-matched-by-w
    hasNonAlphanumeric: /[\W_]+/gm.test(value),
    hasNumber: /\d+/gm.test(value),
    hasLowercase: /[a-z]+/gm.test(value),
    hasUppercase: /[A-Z]+/gm.test(value),
  });

  validate(value: string) {
    const isValid = Object.values(this.validations(value)).reduce(
      (previousValidation, currentValidation) =>
        previousValidation && currentValidation,
    );
    return isValid;
  }

  defaultMessage({ property, value }: ValidationArguments) {
    const startingMessage = `${property} must include at least: `;
    const validationErrors = new Array<string>();
    const validationsChecks = this.validations(value);

    if (!validationsChecks.hasLowercase)
      validationErrors.push('one lowercase alphabetic character');
    if (!validationsChecks.hasUppercase)
      validationErrors.push('one uppercase alphabetic character');
    if (!validationsChecks.hasNumber) validationErrors.push('one number');
    if (!validationsChecks.hasNonAlphanumeric)
      validationErrors.push('one non-alphanumeric character (#,$,%,etc)');

    return startingMessage.concat(validationErrors.join(', '));
  }
}
