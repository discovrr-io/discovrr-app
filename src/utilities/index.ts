import { Alert } from 'react-native';
import {
  AlertMessage,
  FEATURE_UNAVAILABLE,
  SOMETHING_WENT_WRONG,
} from 'src/constants/strings';

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
  if (count < 10 ** 3) {
    return count.toString();
  } else if (count < 10 ** 6) {
    return `${(count / 10 ** 3).toFixed(1)}${ShortenedNumberSuffix.THOUSAND}`;
  } else if (count < 10 ** 9) {
    return `${(count / 10 ** 6).toFixed(1)}${ShortenedNumberSuffix.MILLION}`;
  } else if (count < 10 ** 12) {
    return `${(count / 10 ** 9).toFixed(1)}${ShortenedNumberSuffix.BILLION}`;
  } else {
    // This number is way too large to appropriately format in the UI.
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

export function alertSomethingWentWrong(message?: string) {
  Alert.alert(
    SOMETHING_WENT_WRONG.title,
    message ?? SOMETHING_WENT_WRONG.message,
  );
}

export function alertUnavailableFeature(
  options: AlertMessage = FEATURE_UNAVAILABLE,
) {
  Alert.alert(options.title, options.message);
}
