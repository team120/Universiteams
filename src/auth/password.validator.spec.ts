import { ValidationArguments } from 'class-validator';
import { IsValidPasswordValidator } from './password.validator';

describe('IsValidPasswordValidator', () => {
  const validator = new IsValidPasswordValidator();
  describe('when all checks pass', () => {
    it.each(['Password_221'])(
      'should return true (inputValue %p)',
      (validPassword: string) => {
        expect(validator.validate(validPassword)).toBe(true);
      },
    );
  });
  describe('when not every check pass', () => {
    it.each([
      ['password', false],
      ['Password', false],
      ['Password1', true],
      ['Pass_word', true],
      ['%', false],
      ['1', false],
      ['-1215assa', false],
      ['ASA87', false],
      ["$$$7878'", false],
    ])(
      'should return false and a validation error (inputValue %p)',
      (invalidPassword: string, valid: boolean) => {
        expect(validator.validate(invalidPassword)).toBe(valid);
        expect(
          validator.defaultMessage({
            property: 'Password',
            value: invalidPassword,
          } as ValidationArguments),
        ).toBe(
          'La clave debe cumplir al menos 4 de las 5 pautas contiguas:Tiene al menos 8 caracteres, Incluye un número, Incluye una letra minúscula, Incluye una letra mayúscula, Incluye un símbolo especial',
        );
      },
    );
  });
});
