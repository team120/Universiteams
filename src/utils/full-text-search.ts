// The words of a search text: letters (with their accents, even when typed
// as separate combining marks) and digits. Spaces and symbols only separate
// words, so characters with a meaning in tsquery (& | ! : ( ) ') never reach
// it.
export const searchWords = (text: string): string[] =>
  text.split(/[^\p{L}\p{M}\p{N}]+/u).filter((word) => word.length > 0);

// A tsquery that matches documents with every word, each word as a prefix
// when asked: ['juan', 'riz'] -> 'juan:* & riz:*'. Undefined with no words.
export const toTsQuery = (
  words: string[],
  { prefix }: { prefix: boolean },
): string | undefined =>
  words.length > 0
    ? words.map((word) => (prefix ? `${word}:*` : word)).join(' & ')
    : undefined;
