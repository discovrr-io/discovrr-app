import storage from '@react-native-firebase/storage';
import { nanoid } from '@reduxjs/toolkit';

import { MediaSource } from 'src/api';

export * from './alert';

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

type GenerateStoragePathConfig = { filename: string; isVideo: boolean };

export function uploadFileToFirebase(
  source: MediaSource,
  generateStoragePath: (config: GenerateStoragePathConfig) => string,
) {
  const localFilePath = source.path ?? source.url;

  const fileId = nanoid();
  const isVideo = source.mime.includes('video');
  const extension = isVideo ? 'mp4' : 'jpg';
  const filename = `${fileId}.${extension}`;
  const storagePath = generateStoragePath({ filename, isVideo });

  const reference = storage().ref(storagePath);
  const uploadTask = reference.putFile(localFilePath);

  return [filename, uploadTask, reference] as const;
}
