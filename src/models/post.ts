import { EntityId } from '@reduxjs/toolkit';

import { ImageSource } from './common';
import { ProfileId } from './profile';

/**
 * The unique identifier type of a given post.
 */
export type PostId = EntityId;

/**
 * The type of a given post.
 *
 * A post is either just text, a series of images or a video.
 */
export type PostType = 'text' | 'images' | 'video';

/**
 * The source of a given post's media item.
 *
 * A given post may contain any number of media with its source as an explicit
 * URI or a number (returned by `require`) as its location.
 */
export type PostMedia = ImageSource[];

/**
 * The location of a given post.
 *
 * This is an optional object that may be tagged to a post with the user's
 * coordinates and its location in human-readable form.
 */
export type PostLocation = {
  coordinates: { latitude: number; longitude: number };
  text: string;
};

export type PostMetrics = {
  didSave: boolean;
  didLike: boolean;
  totalLikes: number;
  // likers: ProfileId[];
};

/**
 * An interface describing the structure of a post item.
 */
export default interface Post {
  id: PostId;
  profileId: ProfileId;
  createdAt: string;
  type: PostType;
  caption: string;
  media?: PostMedia;
  location?: PostLocation;
  metrics?: PostMetrics;
}
