/**
 * Representation of the source of an image file.
 *
 * It may be a number (returned by `require`) or an object containing properties
 * such as the URI of the image file.
 */
export type ImageSource =
  | number
  | { type?: string; uri: string; width: number; height: number };
