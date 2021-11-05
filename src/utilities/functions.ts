// For now, this is okay for English localisations
export enum ShortenedNumberSuffix {
  BILLION = 'B',
  MILLION = 'M',
  THOUSAND = 'K',
}

/**
 * Shortens a large number to a string formatted as a decimal value with a
 * suffix indicating its power.
 *
 * @param count The large number to shortened.
 * @returns A string with the shortened form of `count`.
 */
export function shortenLargeNumber(count: number): string {
  function truncateNumberByPower(value: number, power: number): string {
    return (Math.floor((value / 10 ** power) * 10) / 10).toFixed(1);
  }

  if (count < 10 ** 3) {
    return count.toString();
  } else if (count < 10 ** 6) {
    const truncated = truncateNumberByPower(count, 3);
    return `${truncated}${ShortenedNumberSuffix.THOUSAND}`;
  } else if (count < 10 ** 9) {
    const truncated = truncateNumberByPower(count, 6);
    return `${truncated}${ShortenedNumberSuffix.MILLION}`;
  } else if (count < 10 ** 12) {
    const truncated = truncateNumberByPower(count, 9);
    return `${truncated}${ShortenedNumberSuffix.BILLION}`;
  } else {
    // This number is way too large to be appropriately displayed in the UI.
    return '∞';
  }
}

/**
 * Generates a random number between `min` (inclusive) and `max` (exclusive).
 *
 * @param min The inclusive lowest number that can be randomly generated.
 * @param max The exclusive highest number that can be randomly generated.
 */
export function generateRandomNumberBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Calculates the number of words in a given string. This uses Regex internally.
 *
 * NOTE: This won't work as expected for scripts that don't have a notion of a
 * space character to separate words (such as Chinese, Japanese or Thai). For
 * most other scripts though, it's good enough.
 *
 * @param input A string to get the word count of.
 * @returns The number of words found in the input string (precisely, the number
 * of elements that are not a whitespace character).
 */
export function getWordCount(input: string): number {
  return (input.trim().match(/\S+/g) ?? []).length;
}
