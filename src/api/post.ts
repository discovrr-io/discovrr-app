import Parse from 'parse/react-native';

import { Post, ProfileId } from 'src/models';
import { PostContents, PostId, PostLocation } from 'src/models/post';
import { Pagination } from 'src/models/common';

import {
  ApiError,
  CommonApiErrorCode,
  ApiObjectStatus,
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
      postContents = { type: 'text', text: caption };
    } else if (media.length === 1 && media[0].mime.includes('video')) {
      postContents = { type: 'video', source: media[0], caption };
    } else {
      postContents = { type: 'gallery', sources: media, caption };
    }

    const statistics: Parse.Object | undefined = result.get('statistics');
    const likersArray: string[] = statistics?.get('likersArray') ?? [];
    const viewersArray: string[] = statistics?.get('viewersArray') ?? [];

    const didLike = myProfileId
      ? likersArray.some(liker => myProfileId === liker)
      : false;

    return {
      id: result.id as PostId,
      profileId: result.get('profile')?.id,
      contents: postContents,
      createdAt: result.createdAt.toISOString(),
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

  export async function createPost(params: CreatePostParams): Promise<Post> {
    type CreatePostPayload = {
      kind: Post['contents']['type'];
      caption: string;
      media?: MediaSource[];
      location?: PostLocation;
    };

    let payload: CreatePostPayload;
    switch (params.type) {
      case 'gallery':
        payload = {
          kind: 'gallery',
          caption: params.caption,
          media: params.sources,
        };
        break;
      case 'video':
        payload = {
          kind: 'video',
          caption: params.caption,
          media: [params.source],
        };
        break;
      case 'text':
        payload = { kind: 'text', caption: params.text };
        break;
    }

    const result: Parse.Object = await Parse.Cloud.run('createPost', payload);
    // // For some reason this returns an object of type
    // // `{ id: string; className: string; _objCount: number }`
    // const newPostStatistics = newPost.get('statistics')

    // const statisticsQuery = new Parse.Query(Parse.Object.extend('Statistics'));
    // const statistics = await statisticsQuery.get(newPostStatistics.id);

    const myProfile = await UserApi.getCurrentUserProfile();
    return mapResultToPost(result, myProfile?.id);
  }

  //#endregion CREATE OPERATIONS

  //#region READ OPERATIONS

  export type FetchPostByIdParams = {
    postId: PostId;
  };

  export async function fetchPostById(
    params: FetchPostByIdParams,
  ): Promise<Post> {
    const { postId } = params;
    const myProfile = await UserApi.getCurrentUserProfile();
    const postQuery = new Parse.Query(Parse.Object.extend('Post'));
    postQuery.include('statistics');

    const result = await postQuery.get(String(postId));
    return mapResultToPost(result, myProfile?.id);
  }

  export type FetchAllPostsParams = {
    pagination?: Pagination;
  };

  export async function fetchAllPosts(
    params: FetchAllPostsParams,
  ): Promise<Post[]> {
    const { pagination } = params;
    const myProfile = await UserApi.getCurrentUserProfile();
    const postsQuery = new Parse.Query(Parse.Object.extend('Post'));

    postsQuery
      .include('profile', 'statistics')
      .greaterThanOrEqualTo('createdAt', EARLIEST_DATE)
      .descending('createdAt')
      .notEqualTo('status', ApiObjectStatus.DELETED);

    if (pagination) {
      postsQuery
        .limit(pagination.limit)
        .skip(pagination.limit * pagination.currentPage);
    }

    const results = await postsQuery.find();
    // TODO: Filter out posts from blocked profiles
    return results.map(post => mapResultToPost(post, myProfile?.id));
  }

  export type FetchPostsForProfileParams = {
    profileId: ProfileId;
  };

  export async function fetchPostsForProfile(
    params: FetchPostsForProfileParams,
  ): Promise<Post[]> {
    const { profileId } = params;
    const profilePointer: Parse.Pointer = {
      __type: 'Pointer',
      className: 'Profile',
      objectId: String(profileId),
    };

    const myProfile = await UserApi.getCurrentUserProfile();
    const query = new Parse.Query(Parse.Object.extend('Post'));
    query.equalTo('profile', profilePointer);
    query.notEqualTo('status', ApiObjectStatus.DELETED);

    const results = await query.find();
    return results.map(result => mapResultToPost(result, myProfile?.id));
  }

  //#endregion READ OPERATIONS

  //#region UPDATE OPERATIONS

  export type UpdatePostLikeStatusParams = {
    postId: PostId;
    didLike: boolean;
    /**
     * Whether or not to send a notification to the owner of the post.
     *
     * If the owner of the post is the same user as the one who liked the post
     * (i.e. the current user has liked their own post), no notification will be
     * sent, even if this property is set to `true`.
     *
     * @default false
     */
    sendNotification?: boolean;
  };

  export async function updatePostLikeStatus(
    params: UpdatePostLikeStatusParams,
  ) {
    await Parse.Cloud.run('updatePostLikeStatus', params);
  }

  export type UpdatePostViewCounterParams = {
    postId: PostId;
  };

  export async function updatePostViewCounter(_: UpdatePostViewCounterParams) {
    throw new Error('Unimplemented: PostApi.updatePostViewCounter');
  }

  //#endregion UPDATE OPERATIONS

  //#region DELETE OPERATIONS

  export type DeletePostParams = {
    postId: PostId;
  };

  export async function deletePost(params: DeletePostParams) {
    await Parse.Cloud.run('deletePost', params);
  }

  //#endregion DELETE OPERATIONS

  //#region MISCELLANEOUS OPERATIONS

  export type ReportPostParams = {
    postId: PostId;
    reason?: string;
  };

  export async function reportPost(params: ReportPostParams) {
    await Parse.Cloud.run('reportPost', params);
  }

  //#endregion MISCELLANEOUS OPERATIONS
}
