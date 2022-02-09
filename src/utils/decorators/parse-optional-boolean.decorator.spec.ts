import { parseOptionalBooleanFunc } from './parse-optional-boolean.decorator';

describe('parseOptionalBooleanFunc has an input value that is', () => {
  describe('already of boolean type', () => {
    it('should return it without changes', () => {
      const result = parseOptionalBooleanFunc(false);
      expect(result).toBe(false);
    });
  });

  describe('of a different type from string and boolean', () => {
    describe('when no default value is provided', () => {
      it.each([undefined, {}, { prop: 'random' }, 1, -51115])(
        'should return undefined',
        (inputValue) => {
          const result = parseOptionalBooleanFunc(inputValue);
          expect(result).toBe(undefined);
        },
      );
    });
    describe('when a default value is provided', () => {
      it.each([
        [undefined, false],
        [{}, true],
        [{ prop: 'random' }, false],
        [1, true],
        [-51115, false],
      ])('should return undefined', (inputValue, defaultValue) => {
        const result = parseOptionalBooleanFunc(inputValue, defaultValue);
        expect(result).toBe(defaultValue);
      });
    });
  });

  describe('"true"', () => {
    it.each([true, false, undefined])(
      'should return true (boolean) even when a default value was provided',
      (defaultValue) => {
        const result = parseOptionalBooleanFunc('true', defaultValue);
        expect(result).toBe(true);
      },
    );
  });

  describe('"false" ', () => {
    it.each([true, false, undefined])(
      'should return false (boolean) even when a default value was provided',
      (defaultValue) => {
        const result = parseOptionalBooleanFunc('false', defaultValue);
        expect(result).toBe(false);
      },
    );
  });

  describe('another string value', () => {
    describe('when no default value was provided', () => {
      it.each(['some', 'anotheCrazyValue', 'take this one'])(
        'should return undefined',
        (inputString) => {
          const result = parseOptionalBooleanFunc(inputString);
          expect(result).toBe(undefined);
        },
      );
    });
    describe('when a default value was provided', () => {
      it.each([
        ['some', false],
        ['anotheCrazyValue', true],
        ['take this one', false],
      ])('should return undefined', (inputString, defaultValue) => {
        const result = parseOptionalBooleanFunc(inputString, defaultValue);
        expect(result).toBe(defaultValue);
      });
    });
  });
});
