import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export interface IRequirement {
  validate: (password: string) => boolean;
  label: string;
}

export const requirements: IRequirement[] = [
  {
    validate: (password: string) => password.length >= 8,
    label: 'Tiene al menos 8 caracteres',
  },
  {
    validate: (password: string) => /[0-9]/.test(password),
    label: 'Incluye un número',
  },
  {
    validate: (password: string) => /[a-z]/.test(password),
    label: 'Incluye una letra minúscula',
  },
  {
    validate: (password: string) => /[A-Z]/.test(password),
    label: 'Incluye una letra mayúscula',
  },
  {
    validate: (password: string) => /[\\W_]/.test(password),
    label: 'Incluye un símbolo especial',
  },
];

export const IsValidPassword =
  (validationOptions?: ValidationOptions) =>
  // eslint-disable-next-line @typescript-eslint/ban-types
  (object: Object, propertyName: string) => {
    registerDecorator({
      name: 'IsValidPassword',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: IsValidPasswordValidator,
    });
  };

@ValidatorConstraint({ async: false })
export class IsValidPasswordValidator implements ValidatorConstraintInterface {
  validate(value: string) {
    return (
      requirements.filter((requirement) => requirement.validate(value))
        .length >= 4
    );
  }

  defaultMessage({}: ValidationArguments) {
    const startingMessage = `La clave debe cumplir al menos 4 de las 5 pautas contiguas:`;
    const validationLabels = requirements.map(
      (requirement) => requirement.label,
    );
    return startingMessage.concat(validationLabels.join(', '));
  }
}
