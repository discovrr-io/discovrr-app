import Parse from 'parse/react-native';

import { Post } from 'src/models';
import { PostContents, PostId, PostLocation, PostType } from 'src/models/post';
import { Pagination } from 'src/models/common';

import {
  ApiError,
  CommonApiErrorCode,
  InternalObjectStatus,
  MediaSource,
} from './common';
import { UserApi } from './user';

const EARLIEST_DATE = new Date('2020-10-30');

export namespace PostApi {
  export type PostApiErrorCode = CommonApiErrorCode;
  export class PostApiError extends ApiError<PostApiErrorCode> {}

  function mapResultToPost(
    result: Parse.Object,
    myProfileId?: string | undefined,
  ): Post {
    let postContents: PostContents;
    const media: MediaSource[] = result.get('media') ?? [];
    const caption: string = result.get('caption') ?? '';

    if (media.length === 0) {
      postContents = { type: PostType.TEXT, text: caption };
    } else if (media.length === 1 && media[0].mime.includes('video')) {
      postContents = { type: PostType.VIDEO, source: media[0], caption };
    } else {
      postContents = { type: PostType.GALLERY, sources: media, caption };
    }

    const statistics: Parse.Object | undefined = result.get('statistics');
    const likersArray: string[] = statistics?.get('likersArray') ?? [];
    const viewersArray: string[] = statistics?.get('viewersArray') ?? [];

    const didLike = myProfileId
      ? likersArray.some(liker => myProfileId === liker)
      : false;

    return {
      id: result.id as PostId,
      profileId: result.get('owner')?.id,
      contents: postContents,
      createdAt: result.createdAt.toJSON(),
      location: result.get('location'),
      statistics: {
        didLike,
        didSave: false,
        totalLikes: likersArray.length,
        totalViews: viewersArray.length,
      },
    };
  }

  //#region CREATE OPERATIONS

  export type CreatePostParams = PostContents & {
    location?: PostLocation;
  };

  export async function createPost(contents: CreatePostParams): Promise<Post> {
    type CreatePostPayload = {
      kind: 'text' | 'gallery' | 'video';
      caption: string;
      media?: MediaSource[];
      location?: PostLocation;
    };

    // TODO: Upload media
    let payload: CreatePostPayload;
    switch (contents.type) {
      case PostType.GALLERY:
        payload = {
          kind: 'gallery',
          caption: contents.caption,
          media: contents.sources.map(it => it),
        };
        break;
      case PostType.VIDEO:
        payload = {
          kind: 'video',
          caption: contents.caption,
          media: undefined,
        };
        break;
      case PostType.TEXT: /* FALLTHROUGH */
      default:
        payload = { kind: 'text', caption: contents.text };
        break;
    }

    const newPost: Parse.Object = await Parse.Cloud.run('createPost', payload);
    // // For some reason this returns an object of type
    // // `{ id: string; className: string; _objCount: number }`
    // const newPostStatistics = newPost.get('statistics')

    // const statisticsQuery = new Parse.Query(Parse.Object.extend('Statistics'));
    // const statistics = await statisticsQuery.get(newPostStatistics.id);

    const myProfile = await UserApi.getCurrentUserProfile();
    return mapResultToPost(newPost, myProfile?.id);
  }

  //#endregion CREATE OPERATIONS

  //#region READ OPERATIONS

  export async function fetchPostById(postId: string): Promise<Post> {
    const myProfile = await UserApi.getCurrentUserProfile();
    const postQuery = new Parse.Query(Parse.Object.extend('Post'));
    postQuery.equalTo('objectId', postId);
    postQuery.include('statistics');

    const result = await postQuery.first();
    if (!result)
      throw new PostApiError(
        'NOT_FOUND',
        `No post was found with the ID '${postId}'.`,
      );

    return mapResultToPost(result, myProfile?.id);
  }

  /**
   * Fetches every single post in the database.
   */
  export async function fetchAllPosts(
    pagination?: Pagination,
  ): Promise<Post[]> {
    const myProfile = await UserApi.getCurrentUserProfile();
    const postsQuery = new Parse.Query(Parse.Object.extend('Post'));

    postsQuery
      .include('profile', 'statistics')
      .greaterThanOrEqualTo('createdAt', EARLIEST_DATE)
      .descending('createdAt')
      .notEqualTo('status', InternalObjectStatus.DELETED);

    if (pagination) {
      postsQuery
        .limit(pagination.limit)
        .skip(pagination.limit * pagination.currentPage);
    }

    const results = await postsQuery.find();
    // TODO: Filter out posts from blocked profiles
    return results.map(post => mapResultToPost(post, myProfile?.id));
  }

  export async function fetchPostsForProfile(
    profileId: string,
  ): Promise<Post[]> {
    const profilePointer: Parse.Pointer = {
      __type: 'Pointer',
      className: 'Profile',
      objectId: profileId,
    };

    const myProfile = await UserApi.getCurrentUserProfile();
    const query = new Parse.Query(Parse.Object.extend('Post'));
    query.equalTo('profile', profilePointer);
    query.notEqualTo('status', InternalObjectStatus.DELETED);

    const results = await query.find();
    return results.map(result => mapResultToPost(result, myProfile?.id));
  }

  //#endregion READ OPERATIONS

  //#region UPDATE OPERATIONS

  export async function updatePostLikeStatus(
    postId: string,
    didLike: boolean,
    sendNotification?: boolean,
  ) {
    await Parse.Cloud.run('updatePostLikeStatus', {
      postId,
      didLike,
      sendNotification,
    });
  }

  export async function updatePostViewCounter(_postId: string) {
    throw new Error('Unimplemented: PostApi.updatePostViewCounter');

    /*
    const $FUNC = '[PostApi.updatePostViewCounter]';

    const myProfile = await UserApi.getCurrentUserProfile();
    if (!myProfile) throw new UserApi.UserNotFoundApiError();

    const query = new Parse.Query(Parse.Object.extend('Post'));
    query.equalTo('objectId', postId);

    const post = await query.first();
    if (!post)
      throw new PostApiError(
        'NOT_FOUND',
        `No post was found with the ID '${postId}'.`,
      );

    const profileViewedPostsRelation = myProfile.relation('viewedPosts');
    const profileViewedPostsArray = myProfile.get('viewedPostsArray') ?? [];
    const profileViewedPostsSet = new Set<string>(profileViewedPostsArray);

    console.log($FUNC, 'Adding viewed post...');
    profileViewedPostsRelation.add(post);
    profileViewedPostsSet.add(post.id);
    myProfile.set('viewedPostsArray', [...profileViewedPostsSet]);
    myProfile.set('viewedPostsCount', profileViewedPostsSet.size);

    const postViewersRelation = post.relation('viewers');
    const postViewersArray = post.get('viewersArray') ?? [];
    const postViewersSet = new Set<string>(postViewersArray);

    console.log($FUNC, 'Adding viewer profile...');
    postViewersRelation.add(myProfile);
    post.set('viewersArray', [...postViewersSet.add(myProfile.id)]);
    // A "view" is counted as the number of times a user has visited the
    // product's page spaced out in 5 minute intervals. If the last visit was
    // less than 5 minutes ago, it will NOT be counted as a view.
    post.increment('viewersCount');

    console.log($FUNC, 'Saving changes...');
    await Promise.all([myProfile.save(), post.save()]);
    console.log($FUNC, 'Successfully saved');
    */
  }

  //#endregion UPDATE OPERATIONS

  //#region DELETE OPERATIONS

  export async function deletePost(postId: string) {
    await Parse.Cloud.run('deletePost', { postId });
  }

  //#endregion DELETE OPERATIONS
}
