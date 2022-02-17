import { CurrentDateService } from './current-date';

describe('CurrentDate', () => {
  describe('when its input date is a valid ISO 8601 date', () => {
    it.each(['2020-01-01', '2020-12-31', '2021-01-01', '2020-12-31'])(
      'should return a correctly formatted ISO 8601 date without time component',
      (simulatedCurrentDate) => {
        const currentDateService = new CurrentDateService(simulatedCurrentDate);

        const result = currentDateService.get();

        expect(result).toBe(simulatedCurrentDate);
      },
    );
  });

  describe('when no input date is provided', () => {
    it('should return a correctly formatted ISO 8601 date without time component', () => {
      const currentDateService = new CurrentDateService();

      const result = currentDateService.get();

      const now = new Date();
      const year = now.getUTCFullYear().toString();
      const month = (now.getUTCMonth() + 1).toString().padStart(2, '0');
      const day = now.getUTCDate().toString().padStart(2, '0');
      expect(result).toBe(`${year}-${month}-${day}`);
    });
  });

  describe('when a invalid input date is provided', () => {
    it.each(['2020-12-', '2021--01', '-12-31', '12-31'])(
      'should throw an error (inputValue %p)',
      (simulatedCurrentDate) => {
        const currentDateService = new CurrentDateService(simulatedCurrentDate);

        try {
          currentDateService.get();
        } catch (e) {
          expect(e.message).toBe("currentDate doesn't match ISO 8601 format");
        }
        expect.assertions(1);
      },
    );
  });
});
