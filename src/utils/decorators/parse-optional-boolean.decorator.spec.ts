import { parseOptionalBooleanFunc } from './parse-optional-boolean.decorator';

describe('parseOptionalBooleanFunc has an input value that is', () => {
  describe('already of boolean type', () => {
    it('should return it without changes', () => {
      const result = parseOptionalBooleanFunc(false);
      expect(result).toBe(false);
    });
  });

  describe('of a different type from string and boolean', () => {
    it.each([undefined, {}, { prop: 'random' }, 1, -51115])(
      'should return undefined',
      (inputValue) => {
        const result = parseOptionalBooleanFunc(inputValue);
        expect(result).toBe(undefined);
      },
    );
  });

  describe('"true"', () => {
    it('should return true (boolean)', () => {
      const result = parseOptionalBooleanFunc('true');
      expect(result).toBe(true);
    });
  });

  describe('"false"', () => {
    it('should return false (boolean)', () => {
      const result = parseOptionalBooleanFunc('false');
      expect(result).toBe(false);
    });
  });

  describe('"undefined"', () => {
    it('should return undefined', () => {
      const result = parseOptionalBooleanFunc('undefined');
      expect(result).toBe(undefined);
    });
  });

  describe('another string value', () => {
    it.each(['some', 'anotheCrazyValue', 'take this one'])(
      'should return undefined',
      (inputString) => {
        const result = parseOptionalBooleanFunc(inputString);
        expect(result).toBe(undefined);
      },
    );
  });
});
