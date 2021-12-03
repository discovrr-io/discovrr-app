import { ProfileId } from './profile';

/**
 * Representation of the source of an image file.
 *
 * It may be a number (from a local file imported with `require`) or an object
 * containing properties such as the URI of the image file.
 */
export type ImageSource =
  | number
  | { uri: string; width?: number; height?: number };

export type Coordinates = {
  readonly latitude: number;
  readonly longitude: number;
};

export type LocationQueryPreferences = {
  readonly searchRadius?: number;
  readonly coordinates?: Coordinates;
};

export type AppearancePreferences = 'system' | 'light' | 'dark' | 'debug';

export const MIN_SEARCH_RADIUS = 3;
export const MAX_SEARCH_RADIUS = 25;

export const DEFAULT_SEARCH_RADIUS = 100;

// Redfern Coordinates
export const DEFAULT_COORDINATES = {
  latitude: -33.89296377479401,
  longitude: 151.20546154794323,
};

export type Pagination = {
  readonly limit: number;
  readonly currentPage: number;
  readonly oldestDateFetched?: Date;
};

/**
 * An object that records useful social metadata of an item with a `statistics`
 * property.
 */
export type Statistics = {
  /** @deprecated Use `likers` array instead. */
  readonly didLike: boolean;

  /** @deprecated Use `likers` array instead. */
  readonly totalLikes: number;

  readonly likers: ProfileId[];

  readonly totalViews: number;

  /**
   * An optional date-time string of the when the item associated with this
   * `Statistics` object was last viewed.
   *
   * This should only be used in the client to be recorded in the Redux store.
   * This is also why its type is `string` – for serialization purposes.
   */
  readonly __lastViewed?: string;
};

export type SessionId = string & { __sessionIdBrand: any };
