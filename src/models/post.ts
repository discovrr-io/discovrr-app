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
export type PostSource = ImageSource;

/**
 * The main body of a given post.
 *
 * The contents of a post differs depending on whether it is a text post, an
 * image gallery post or a video post.
 */
export type PostContent =
  | { type: 'text'; text: string }
  | { type: 'image-gallery'; sources: PostSource[]; caption: string }
  | { type: 'video'; source: PostSource; caption: string };

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

export type PostStatistics = {
  didSave: boolean;
  didLike: boolean;
  totalLikes: number;
};

/**
 * An interface describing the structure of a post item.
 */
export default interface Post {
  id: PostId;
  profileId: ProfileId;
  content: PostContent;
  createdAt: string;
  location?: PostLocation;
  statistics?: PostStatistics;
}
