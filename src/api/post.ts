import Parse from 'parse/react-native';

import { Comment, Post } from '../models';
import { PostId, PostContent } from '../models/post';
import { ImageSource } from '../models/common';

import { DEFAULT_IMAGE_DIMENSIONS } from '../constants/media';
import { MediaSource } from '.';

const EARLIEST_DATE = new Date('2020-10-30');

export namespace PostApi {
  function mapResultToPost(
    profileId: string | undefined,
    result: Parse.Object<Parse.Attributes>,
  ): Post {
    let postContent: PostContent;
    const media: MediaSource[] = result.get('media') ?? [];
    const caption: string = result.get('caption') ?? '';

    if (media.length === 0) {
      postContent = { type: 'text', text: caption };
    } else if (media.length === 1 && media[0].mime.includes('video')) {
      const video = media[0];
      const source: ImageSource = {
        uri: video.url,
        width: video.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
        height: video.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
      };
      postContent = { type: 'video', source, caption };
    } else {
      const sources = media.map((item) => ({
        uri: item.url,
        width: item.width ?? DEFAULT_IMAGE_DIMENSIONS.width,
        height: item.height ?? DEFAULT_IMAGE_DIMENSIONS.height,
      }));
      postContent = { type: 'image-gallery', sources, caption };
    }

    const likersArray = (result.get('likersArray') as Array<string>) ?? [];
    const totalLikes = likersArray.length;
    const didLike = profileId
      ? likersArray.some((liker) => profileId === liker)
      : false;

    return {
      id: result.id,
      profileId: result.get('profile')?.id,
      content: postContent,
      createdAt: result.createdAt.toJSON(),
      location: result.get('location'),
      statistics: { didSave: false, totalLikes, didLike },
    } as Post;
  }

  /**
   * Fetches every single post in the database.
   */
  export async function fetchAllPosts(): Promise<Post[]> {
    try {
      console.group('PostApi.fetchAllPosts');
      const currentUser = await Parse.User.currentAsync();
      const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
      profileQuery.equalTo('owner', currentUser);

      let profileId: string | undefined = undefined;
      if (currentUser) {
        profileQuery.equalTo('owner', currentUser);
        const profile = await profileQuery.first();
        console.log('Found Parse profile:', profile?.id);
        profileId = profile?.id;
      }

      const postsQuery = new Parse.Query(Parse.Object.extend('Post'));
      postsQuery.include('profile');
      postsQuery.greaterThanOrEqualTo('createdAt', EARLIEST_DATE);
      postsQuery.descending('createdAt');

      // TODO: Limit query
      // query.limit(<LIMIT>);
      // query.skip(<LIMIT> * <CURRENT_PAGE_INDEX>);

      const results = await postsQuery.find();
      // TODO: Filter out posts from blocked profiles
      const posts: Post[] = results
        .filter((post) => {
          // We only want posts that have a 'profile' field (so we know who the
          // author of that particular post is).
          return !!post.get('profile')?.id;
        })
        .map((post) => mapResultToPost(profileId, post));

      return posts;
    } catch (error) {
      console.error('Failed to fetch all posts:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  export async function fetchPostById(postId: string): Promise<Post | null> {
    try {
      console.group('ProfileApi.fetchPostById');
      const currentUser = await Parse.User.currentAsync();
      const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
      profileQuery.equalTo('owner', currentUser);

      let profileId: string | undefined = undefined;
      if (currentUser) {
        profileQuery.equalTo('owner', currentUser);
        const profile = await profileQuery.first();
        console.log(
          '[PostApi.fetchAllPosts] Found Parse profile:',
          profile?.id,
        );
        profileId = profile?.id;
      }

      const postQuery = new Parse.Query(Parse.Object.extend('Post'));
      postQuery.equalTo('objectId', postId);

      const result = await postQuery.first();
      if (result) {
        return mapResultToPost(profileId, result);
      } else {
        console.warn('No profile found with id:', profileId);
        return null;
      }
    } catch (error) {
      console.error('Failed to fetch profile by id:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  export async function setLikeStatus(postId: PostId, didLike: boolean) {
    try {
      console.group('PostApi.setLikeStatus');
      await Parse.Cloud.run('likeOrUnlikePost', { postId, like: didLike });
      console.log(`Successfully ${didLike ? 'liked' : 'unliked'} post`);
    } catch (error) {
      console.error(`Failed to ${didLike ? 'like' : 'unlike'} post:`, error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }

  export async function fetchCommentsForPost(
    postId: string,
  ): Promise<Comment[]> {
    try {
      console.group('PostApi.fetchCommentsForPosts');
      const postPointer = {
        __type: 'Pointer',
        className: 'Post',
        objectId: postId,
      };

      const query = new Parse.Query(Parse.Object.extend('PostComment'));
      query.equalTo('post', postPointer);
      query.include('profile');

      const results = await query.find();
      console.log(`Found ${results.length} comment(s) for post '${postId}'`);

      const comments = results.map(
        (comment) =>
          ({
            id: comment.id,
            postId: comment.get('post').id,
            profileId: comment.get('profile').id,
            createdAt: comment.createdAt.toJSON(),
            message: comment.get('message') ?? '',
          } as Comment),
      );

      return comments;
    } catch (error) {
      console.error(`Failed to fetch comments for post:`, error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }
}
