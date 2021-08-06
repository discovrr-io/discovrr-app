import Parse from 'parse/react-native';

import { MediaSource } from '.';
import { Comment, Post } from '../models';
import { PostId, PostContent } from '../models/post';
import { ImageSource, Pagination } from '../models/common';

import { UserApi } from './user';
import { DEFAULT_IMAGE_DIMENSIONS } from '../constants/media';

const EARLIEST_DATE = new Date('2020-10-30');

export namespace PostApi {
  function mapResultToPost(
    currentProfileId: string | undefined,
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

    const likersArray: string[] = result.get('likersArray') ?? [];
    const totalLikes = likersArray.length;
    const didLike = currentProfileId
      ? likersArray.some((liker) => currentProfileId === liker)
      : false;

    return {
      id: result.id,
      profileId: result.get('profile')?.id,
      content: postContent,
      createdAt: result.createdAt.toJSON(),
      location: result.get('location'),
      statistics: {
        didSave: false,
        didLike,
        totalLikes,
        totalViews: result.get('viewersCount') ?? 0,
      },
    } as Post;
  }

  /**
   * Fetches every single post in the database.
   */
  export async function fetchAllPosts(
    pagination?: Pagination,
  ): Promise<Post[]> {
    const $FUNC = '[PostApi.fetchAllPosts]';

    try {
      const currentUser = await Parse.User.currentAsync();
      const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));

      let profileId: string | undefined = undefined;
      if (currentUser) {
        profileQuery.equalTo('owner', currentUser);
        const profile = await profileQuery.first();
        console.log($FUNC, 'Found current user profile:', profile?.id);
        profileId = profile?.id;
      }

      const postsQuery = new Parse.Query(Parse.Object.extend('Post'));
      postsQuery.include('profile');
      postsQuery.greaterThanOrEqualTo('createdAt', EARLIEST_DATE);
      postsQuery.descending('createdAt');

      if (pagination) {
        postsQuery.limit(pagination.limit);
        postsQuery.skip(pagination.limit * pagination.currentPage);
      }

      const results = await postsQuery.find();
      // TODO: Filter out posts from blocked profiles
      const posts: Post[] = results
        // We only want posts that have a 'profile' field (so we know who the
        // author of that particular post is).
        // .filter((post) => !!post.get('profile')?.id)
        .map((post) => mapResultToPost(profileId, post));

      return posts;
    } catch (error) {
      console.error($FUNC, 'Failed to fetch all posts:', error);
      throw error;
    }
  }

  export async function fetchPostsForProfile(
    profileId: string,
  ): Promise<Post[]> {
    const $FUNC = '[PostApi.fetchPostsForProfile]';

    try {
      const profilePointer = {
        __type: 'Pointer',
        className: 'Profile',
        objectId: profileId,
      };

      const currentProfile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Post'));
      query.equalTo('profile', profilePointer);

      const results = await query.find();
      return results.map((result) =>
        mapResultToPost(currentProfile?.id, result),
      );
    } catch (error) {
      console.error($FUNC, `Failed to fetch posts for profile:`, error);
      throw error;
    }
  }

  // TODO: Move the implementation of this to a backend cloud function
  export async function updatePostTextContent(
    postId: string,
    text: string,
  ): Promise<Post> {
    const $FUNC = '[Post.updatePostTextContent]';
    const currentProfile = await UserApi.getCurrentUserProfile();
    const postQuery = new Parse.Query(Parse.Object.extend('Post'));
    const post = await postQuery.get(postId);

    console.log($FUNC, 'New text content:', JSON.stringify(text));
    console.log($FUNC, 'Saving post text content...');
    const newPost = await post.save({ caption: text.trim() });
    console.log($FUNC, 'Successfully saved');

    return mapResultToPost(currentProfile?.id, newPost);
  }

  // TODO: Move the implementation of this to a backend cloud function
  export async function deletePost(postId: string): Promise<void> {
    const $FUNC = '[Post.deletePost]';
    const postQuery = new Parse.Query(Parse.Object.extend('Post'));
    const post = await postQuery.get(postId);

    const commentsQuery = new Parse.Query(Parse.Object.extend('PostComment'));
    commentsQuery.equalTo('post', post.toPointer());
    const commentsToRemove = await commentsQuery.find();
    console.log(
      $FUNC,
      'Found comments to remove:',
      commentsToRemove.map((it) => it.id),
    );

    console.log($FUNC, 'Removing comments...');
    await Parse.Object.destroyAll(commentsToRemove);

    console.log($FUNC, 'Removing post...');
    await post.destroy();

    console.log($FUNC, 'Successfully removed post and associated comments!');
  }

  export async function fetchPostById(postId: string): Promise<Post> {
    const $FUNC = '[Post.fetchPostById]';

    const profile = await UserApi.getCurrentUserProfile();
    const postQuery = new Parse.Query(Parse.Object.extend('Post'));
    postQuery.get(postId);

    const result = await postQuery.first();
    if (!result) {
      console.error($FUNC, 'No post found with id:', postId);
      throw new Error('Failed to find post with given ID.');
    }

    return mapResultToPost(profile?.id, result);
  }

  export async function changePostLikeStatus(postId: string, didLike: boolean) {
    const $FUNC = '[PostApi.changePostLikeStatus]';

    try {
      await Parse.Cloud.run('likeOrUnlikePost', { postId, like: didLike });
      console.log($FUNC, `Successfully ${didLike ? 'liked' : 'unliked'} post`);
    } catch (error) {
      console.error(
        $FUNC,
        `Failed to ${didLike ? 'like' : 'unlike'} post:`,
        error,
      );
      throw error;
    }
  }

  export async function fetchCommentsForPost(
    postId: string,
  ): Promise<Comment[]> {
    const $FUNC = '[PostApi.fetchCommentsForPosts]';

    try {
      const postPointer = {
        __type: 'Pointer',
        className: 'Post',
        objectId: postId,
      };

      const query = new Parse.Query(Parse.Object.extend('PostComment'));
      query.equalTo('post', postPointer);
      query.include('profile');

      const results = await query.find();
      console.log(
        $FUNC,
        `Found ${results.length} comment(s) for post '${postId}'`,
      );

      const comments = results
        .map((comment) => {
          if (!comment.get('profile')) {
            console.warn($FUNC, `Comment '${comment.id}' has no profile`);
            return null;
          }

          return {
            id: comment.id,
            postId: comment.get('post').id,
            profileId: comment.get('profile').id,
            createdAt: comment.createdAt.toJSON(),
            message: comment.get('message') ?? '',
          } as Comment;
        })
        .filter(Boolean);

      return comments;
    } catch (error) {
      console.error($FUNC, 'Failed to fetch comments for post:', error);
      throw error;
    }
  }

  export async function updatePostViewCounter(postId: string) {
    const $FUNC = '[PostApi.updatePostViewCounter]';

    try {
      const profile = await UserApi.getCurrentUserProfile();
      const query = new Parse.Query(Parse.Object.extend('Post'));
      query.equalTo('objectId', postId);

      const post = await query.first();
      console.log($FUNC, 'Found post:', post.id);

      const profileViewedPostsRelation = profile.relation('viewedPosts');
      const profileViewedPostsArray = profile.get('viewedPostsArray') ?? [];
      const profileViewedPostsSet = new Set<string>(profileViewedPostsArray);

      console.log($FUNC, 'Adding viewed post...');
      profileViewedPostsRelation.add(post);
      profileViewedPostsSet.add(post.id);
      profile.set('viewedPostsArray', [...profileViewedPostsSet]);
      profile.set('viewedPostsCount', profileViewedPostsSet.size);

      const postViewersRelation = post.relation('viewers');
      const postViewersArray = post.get('viewersArray') ?? [];
      const postViewersSet = new Set<string>(postViewersArray);

      console.log($FUNC, 'Adding viewer profile...');
      postViewersRelation.add(profile);
      post.set('viewersArray', [...postViewersSet.add(profile.id)]);
      // A "view" is counted as the number of times a user has visited the
      // product's page spaced out in 5 minute intervals. If the last visit was
      // less than 5 minutes ago, it will NOT be counted as a view.
      post.increment('viewersCount');

      console.log($FUNC, 'Saving changes...');
      await Promise.all([profile.save(), post.save()]);
      console.log($FUNC, 'Successfully saved');
    } catch (error) {
      console.error($FUNC, 'Failed to update viewers for post:', error);
      throw error;
    }
  }
}
