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

  if (count < 1e3) {
    return count.toString();
  } else if (count < 1e6) {
    const truncated = truncateNumberByPower(count, 3);
    return `${truncated}${ShortenedNumberSuffix.THOUSAND}`;
  } else if (count < 1e9) {
    const truncated = truncateNumberByPower(count, 6);
    return `${truncated}${ShortenedNumberSuffix.MILLION}`;
  } else if (count < 1e12) {
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

/**
 * Calculates the hexadecimal representation of a decimal number representing a
 * percentage.
 *
 * Adopted from https://gist.github.com/lopspower/03fb1cc0ac9f32ef38f4#gistcomment-3036936
 *
 * @param percent A decimal between `0.0` up to and including `1.0`.
 * @returns The hexadecimal representation of `percentage`.
 */
export function percentToHex(percent: number) {
  // Bound percent from 0 to 1
  const bounded = Math.max(0, Math.min(1, percent));
  // Map percent to nearest integer (0 - 255)
  const decValue = Math.round(bounded * 255);
  // Get hexadecimal representation
  const hexValue = decValue.toString(16);
  // Format with leading 0 and upper case characters
  return hexValue.padStart(2, '0').toUpperCase();
}
