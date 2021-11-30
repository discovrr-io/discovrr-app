import { EntityId } from '@reduxjs/toolkit';

import { MediaSource } from 'src/api';
import { Statistics } from './common';
import { ProfileId } from './profile';

/**
 * The type of a unique identifier for a given post.
 */
export type PostId = EntityId & { __postIdBrand: any };

export type PostType = PostContents['type'];

export type TextPostContents = {
  type: 'text';
  text: string;
};

export type GalleryPostContents<SourceItem = MediaSource> = {
  type: 'gallery';
  sources: SourceItem[];
  thumbnail?: SourceItem;
  caption: string;
};

export type VideoPostContents<SourceItem = MediaSource> = {
  type: 'video';
  source: SourceItem;
  caption: string;
  thumbnail?: SourceItem;
};

export type PostContents<SourceItem = MediaSource> =
  | TextPostContents
  | GalleryPostContents<SourceItem>
  | VideoPostContents<SourceItem>;

export type PostLocation = {
  /**
   * The exact coordinates in latitude and longitude.
   */
  readonly coordinates: { latitude: number; longitude: number };

  /**
   * The human-readable description of this location.
   */
  readonly text: string;
};

/**
 * An interface describing the structure of a post item.
 */
export default interface Post {
  /**
   * The unique ID of this post.
   */
  readonly id: PostId;

  /**
   * The profile ID of the author of this post.
   */
  readonly profileId: ProfileId;

  /**
   * The main body of a given post.
   *
   * The contents of a post differs depending on whether it is a text post, a
   * gallery post or a video post.
   */
  readonly contents: PostContents;

  /**
   * The date-time of when this post was created.
   */
  readonly createdAt: string;

  readonly commentsCount: number;

  /**
   * An optional record of statistics associated with this post.
   */
  readonly statistics: Statistics;

  /**
   * The optional location of a given post.
   *
   * This is an optional object that may be tagged to a post with the user's
   * coordinates and its location in human-readable form.
   */
  readonly location?: PostLocation;
}
