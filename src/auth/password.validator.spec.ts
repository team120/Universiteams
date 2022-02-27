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
      [
        'password',
        'Password must include at least: one uppercase alphabetic character, one number, one non-alphanumeric character (#,$,%,etc)',
      ],
      [
        'Password',
        'Password must include at least: one number, one non-alphanumeric character (#,$,%,etc)',
      ],
      [
        'Password1',
        'Password must include at least: one non-alphanumeric character (#,$,%,etc)',
      ],
      [
        'pass_word',
        'Password must include at least: one uppercase alphabetic character, one number',
      ],
      [
        '%',
        'Password must include at least: one lowercase alphabetic character, one uppercase alphabetic character, one number',
      ],
      [
        '1',
        'Password must include at least: one lowercase alphabetic character, one uppercase alphabetic character, one non-alphanumeric character (#,$,%,etc)',
      ],
      [
        '-1215assa',
        'Password must include at least: one uppercase alphabetic character',
      ],
      [
        'ASA87',
        'Password must include at least: one lowercase alphabetic character, one non-alphanumeric character (#,$,%,etc)',
      ],
      [
        "$$$7878'",
        'Password must include at least: one lowercase alphabetic character, one uppercase alphabetic character',
      ],
    ])(
      'should return false and a validation error (inputValue %p)',
      (invalidPassword: string, validationErrorMessage: string) => {
        expect(validator.validate(invalidPassword)).toBe(false);
        expect(
          validator.defaultMessage({
            property: 'Password',
            value: invalidPassword,
          } as ValidationArguments),
        ).toBe(validationErrorMessage);
      },
    );
  });
});
