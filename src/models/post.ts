import { EntityId } from '@reduxjs/toolkit';

import { MediaSource } from 'src/api';
import { Statistics } from './common';
import { ProfileId } from './profile';

/**
 * The type of a unique identifier for a given post.
 */
export type PostId = EntityId & { __postIdBrand: any };

/**
 * The type of a given post.
 *
 * A post is either just text, a gallery of images or a video.
 */
export enum PostType {
  TEXT = 'text',
  GALLERY = 'gallery',
  VIDEO = 'video',
}

/**
 * The source of a given post's media item.
 *
 * A given post may contain any number of media with its source as an explicit
 * URI or a number (returned by `require`) as its location.
 */
export type PostSource = MediaSource;

export type PostContents =
  | { type: PostType.TEXT; text: string }
  | { type: PostType.GALLERY; sources: PostSource[]; caption: string }
  | { type: PostType.VIDEO; source: PostSource; caption: string };

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
   * The contents of a post differs depending on whether it is a text post, an
   * image gallery post or a video post.
   */
  readonly contents: PostContents;

  /**
   * The date-time of when this post was created.
   */
  readonly createdAt: string;

  /**
   * The optional location of a given post.
   *
   * This is an optional object that may be tagged to a post with the user's
   * coordinates and its location in human-readable form.
   */
  readonly location?: PostLocation;

  /**
   * An optional record of statistics associated with this post.
   */
  readonly statistics: Statistics;
}
