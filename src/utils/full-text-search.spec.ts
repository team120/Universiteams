import { searchWords, toTsQuery } from './full-text-search';

describe('full-text search', () => {
  describe('searchWords', () => {
    it.each([
      ['juan rizzo', ['juan', 'rizzo']],
      ['  juan   rizzo ', ['juan', 'rizzo']],
      ['juan\trizzo\n', ['juan', 'rizzo']],
      ["o'brien", ['o', 'brien']],
      ['rizzo & (juan | !camila):*', ['rizzo', 'juan', 'camila']],
      ['Ingeniería 2021', ['Ingeniería', '2021']],
      // Accents typed as separate combining marks stay in the word
      ['María'.normalize('NFD'), ['María'.normalize('NFD')]],
      ['', []],
      ['  ', []],
      ['&|!:()', []],
    ])('should split %p into %p', (text, words) => {
      expect(searchWords(text)).toEqual(words);
    });
  });

  describe('toTsQuery', () => {
    it('should match every word as a prefix when asked', () => {
      expect(toTsQuery(['juan', 'riz'], { prefix: true })).toBe(
        'juan:* & riz:*',
      );
    });

    it('should match every whole word otherwise', () => {
      expect(toTsQuery(['utn', 'frro'], { prefix: false })).toBe('utn & frro');
    });

    it('should return undefined with no words', () => {
      expect(toTsQuery([], { prefix: true })).toBeUndefined();
    });
  });
});
