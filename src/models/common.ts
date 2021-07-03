/**
 * Representation of the source of an image file.
 *
 * It may be a number (from a local file imported with `require`) or an object
 * containing properties such as the URI of the image file.
 */
export type ImageSource =
  | number
  | { uri: string; width: number; height: number };

export type GeoPoint = [number, number];

export type LocationQueryPreferences = {
  searchRadius?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
};

export const MIN_SEARCH_RADIUS = 3;
export const MAX_SEARCH_RADIUS = 25;

export const DEFAULT_SEARCH_RADIUS = MIN_SEARCH_RADIUS;

// Redfern Coordinates
export const DEFAULT_COORDINATES = {
  latitude: -33.89296377479401,
  longitude: 151.20546154794323,
};
