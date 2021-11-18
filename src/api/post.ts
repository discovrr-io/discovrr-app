import Parse from 'parse/react-native';

import { ProfileId } from 'src/models/profile';
import { Pagination } from 'src/models/common';
import Post, {
  PostContents,
  PostId,
  PostLocation,
  PostType,
} from 'src/models/post';

import { UserApi } from './user';
import {
  ApiError,
  CommonApiErrorCode,
  ApiObjectStatus,
  MediaSource,
} from './common';

// import { POSTS } from './__mock';
// import { generateRandomNumberBetween } from 'src/utilities';

// function randomWaitTime(): number {
//   return generateRandomNumberBetween(0.5 * 1000, 3 * 1000);
// }

export namespace PostApi {
  export type PostApiErrorCode = CommonApiErrorCode;
  export class PostApiError extends ApiError<PostApiErrorCode> {}

  function mapResultToPost(
    result: Parse.Object,
    myProfileId?: string | undefined,
  ): Post {
    let postContents: PostContents;
    const kind: PostType = result.get('kind');
    const media: MediaSource[] = result.get('media') ?? [];
    const caption: string = result.get('caption') ?? '';
    const thumbnail: MediaSource | undefined = result.get('thumbnail');

    if (kind === 'text' || media.length === 0) {
      postContents = { type: 'text', text: caption };
    } else if (kind === 'video') {
      postContents = { type: 'video', source: media[0], thumbnail, caption };
    } else if (kind === 'gallery') {
      postContents = { type: 'gallery', sources: media, thumbnail, caption };
    } else {
      throw new Error(`Unknown post kind: '${kind}'`);
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
      kind: PostType;
      caption: string;
      media?: MediaSource[];
      thumbnail?: MediaSource;
      location?: PostLocation;
    };

    let payload: CreatePostPayload;
    switch (params.type) {
      case 'gallery':
        payload = {
          kind: 'gallery',
          caption: params.caption,
          media: params.sources,
          thumbnail: params.thumbnail,
        };
        break;
      case 'video':
        payload = {
          kind: 'video',
          caption: params.caption,
          media: [params.source],
          thumbnail: params.thumbnail,
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

  // /*
  export async function fetchPostById(
    params: FetchPostByIdParams,
  ): Promise<Post> {
    const { postId } = params;
    const myProfile = await UserApi.getCurrentUserProfile();
    const postQuery = new Parse.Query(Parse.Object.extend('Post'));
    postQuery.include('profile', 'statistics');

    const result = await postQuery.get(String(postId));
    return mapResultToPost(result, myProfile?.id);
  }
  // */

  /*
  export async function fetchPostById(
    params: FetchPostByIdParams,
  ): Promise<Post> {
    const { postId } = params;
    return new Promise<Post>((resolve, reject) => {
      setTimeout(() => {
        const maybePost = POSTS.find(post => post.id === postId);
        if (maybePost) {
          resolve(maybePost);
        } else {
          reject('Object not found');
        }
      }, randomWaitTime());
    });
  }
  */

  export type FetchAllPostsParams = {
    pagination: Pagination;
  };

  // /*
  export async function fetchAllPosts(
    params: FetchAllPostsParams,
  ): Promise<Post[]> {
    const { pagination } = params;
    const myProfile = await UserApi.getCurrentUserProfile();
    const postsQuery = new Parse.Query(Parse.Object.extend('Post'));

    postsQuery
      .descending('createdAt')
      .include('profile', 'statistics')
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .limit(pagination.limit);

    if (pagination.oldestDateFetched) {
      console.log(`Fetching posts older than ${pagination.oldestDateFetched}`);
      postsQuery.lessThan('createdAt', pagination.oldestDateFetched);
    } else {
      postsQuery.skip(pagination.currentPage * pagination.limit);
    }

    const results = await postsQuery.find();
    // TODO: Filter out posts from blocked profiles
    return results.map(post => mapResultToPost(post, myProfile?.id));
  }
  // */

  /*
  export async function fetchAllPosts(
    params: FetchAllPostsParams,
  ): Promise<Post[]> {
    const { pagination } = params;
    return await new Promise<Post[]>(resolve => {
      setTimeout(() => {
        resolve(POSTS.slice(0, pagination?.limit));
      }, randomWaitTime());
    });
  }
  */

  export type FetchMorePostsParams = {
    pagination: Pagination;
  };

  // /*
  export async function fetchMorePosts(
    params: FetchMorePostsParams,
  ): Promise<Post[]> {
    const { pagination } = params;
    const myProfile = await UserApi.getCurrentUserProfile();
    const postsQuery = new Parse.Query(Parse.Object.extend('Post'));

    postsQuery
      .descending('createdAt')
      .include('profile', 'statistics')
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .limit(pagination.limit);

    if (pagination.oldestDateFetched) {
      console.log(`Fetching posts older than ${pagination.oldestDateFetched}`);
      postsQuery.lessThan('createdAt', pagination.oldestDateFetched);
    } else {
      postsQuery.skip(pagination.currentPage * pagination.limit);
    }

    const results = await postsQuery.find();
    // TODO: Filter out posts from blocked profiles
    return results.map(post => mapResultToPost(post, myProfile?.id));
  }
  // */

  /*
  export async function fetchMorePosts(
    params: FetchMorePostsParams,
  ): Promise<Post[]> {
    const { pagination } = params;
    const skipCount = pagination.currentPage * pagination.limit;
    return await new Promise<Post[]>(resolve => {
      setTimeout(() => {
        resolve(POSTS.slice(skipCount, skipCount + pagination.limit));
      }, randomWaitTime());
    });
  }
  */

  export type FetchPostsForProfileParams = {
    profileId: ProfileId;
    pagination: Pagination;
  };

  // /*
  export async function fetchPostsForProfile(
    params: FetchPostsForProfileParams,
  ): Promise<Post[]> {
    const { profileId, pagination } = params;
    const profilePointer: Parse.Pointer = {
      __type: 'Pointer',
      className: 'Profile',
      objectId: String(profileId),
    };

    const myProfile = await UserApi.getCurrentUserProfile();
    const postsQuery = new Parse.Query(Parse.Object.extend('Post'));

    postsQuery
      .descending('createdAt')
      .include('profile', 'statistics')
      .equalTo('profile', profilePointer)
      .notEqualTo('status', ApiObjectStatus.DELETED);

    if (pagination.oldestDateFetched) {
      postsQuery.lessThan('createdAt', pagination.oldestDateFetched);
    } else {
      postsQuery.skip(pagination.currentPage * pagination.limit);
    }

    const results = await postsQuery.find();
    return results.map(result => mapResultToPost(result, myProfile?.id));
  }
  // */

  /*
  export async function fetchPostsForProfile(
    params: FetchPostsForProfileParams,
  ): Promise<Post[]> {
    const { profileId, pagination } = params;
    const skipCount = pagination.currentPage * pagination.limit;
    return await new Promise<Post[]>((resolve, reject) => {
      setTimeout(() => {
        resolve(
          POSTS.filter(post => post.profileId === profileId).slice(
            skipCount,
            skipCount + pagination.limit,
          ),
        );
      }, randomWaitTime());
    });
  }
  */

  export type FetchLikedPostsForProfile = {
    profileId: ProfileId;
    pagination: Pagination;
  };

  export async function fetchLikedPostsForProfile(
    params: FetchLikedPostsForProfile,
  ) {
    const { profileId, pagination } = params;

    const myProfile = await UserApi.getCurrentUserProfile();
    const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
    const profile = await profileQuery.get(String(profileId));

    const likedPostsQuery = profile.relation('likedPosts').query();

    likedPostsQuery
      .descending('createdAt')
      .include('profile', 'statistics')
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .limit(pagination.limit);

    if (pagination.oldestDateFetched) {
      likedPostsQuery.lessThan('createdAt', pagination.oldestDateFetched);
    } else {
      likedPostsQuery.skip(pagination.currentPage * pagination.limit);
    }

    const results = await likedPostsQuery.find();
    return results.map(post => mapResultToPost(post, myProfile?.id));
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
