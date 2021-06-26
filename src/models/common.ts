/**
 * Representation of the source of an image file.
 *
 * It may be a number (from a local file imported with `require`) or an object
 * containing properties such as the URI of the image file.
 */
export type ImageSource =
  | number
  | { uri: string; width: number; height: number };
