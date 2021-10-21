import Parse from 'parse/react-native';

import { UserApi } from '.';
import { ApiError, CommonApiErrorCode, ApiObjectStatus } from './common';
import {
  Comment,
  CommentId,
  CommentReply,
  PostId,
  ProfileId,
} from 'src/models';

export namespace CommentApi {
  export type CommentApiErrorCode = CommonApiErrorCode | 'INVALID_COMMENT';
  export class CommentApiError extends ApiError<CommentApiErrorCode> {}

  export function mapResultToComment(
    result: Parse.Object,
    myProfileId?: string | undefined,
  ): Comment {
    const statistics: Parse.Object | undefined = result.get('statistics');
    const likersArray: string[] = statistics?.get('likersArray') ?? [];
    const viewersArray: string[] = statistics?.get('viewersArray') ?? [];

    const didLike = myProfileId
      ? likersArray.some(liker => liker === myProfileId)
      : false;

    return {
      id: result.id as CommentId,
      postId: result.get('post').id,
      profileId: result.get('profile').id as ProfileId,
      // profileId: owner.id as ProfileId,
      createdAt: result.createdAt.toISOString(),
      message: result.get('message'),
      statistics: {
        didLike,
        didSave: false,
        totalLikes: likersArray.length,
        totalViews: viewersArray.length,
      },
    };
  }

  //#region READ OPERATIONS

  export type FetchCommentByIdParams = {
    commentId: CommentId;
  };

  export async function fetchCommentById(
    params: FetchCommentByIdParams,
  ): Promise<Comment> {
    const { commentId } = params;
    const myProfile = await UserApi.getCurrentUserProfile();
    const commentQuery = new Parse.Query(Parse.Object.extend('PostComment'));
    commentQuery.include('statistics');
    commentQuery.notEqualTo('status', ApiObjectStatus.DELETED);

    const result = await commentQuery.get(String(commentId));
    if (!result)
      throw new CommentApiError(
        'NOT_FOUND',
        `No comment was found with the ID '${commentId}'`,
      );

    return mapResultToComment(result, myProfile?.id);
  }

  type FetchCommentsForPostParams = {
    postId: PostId;
  };

  export async function fetchCommentsForPost(
    params: FetchCommentsForPostParams,
  ): Promise<Comment[]> {
    const $FUNC = '[CommentApi.fetchCommentsForPosts]';
    const postId = String(params.postId);

    const postPointer: Parse.Pointer = {
      __type: 'Pointer',
      className: 'Post',
      objectId: postId,
    };

    const myProfile = await UserApi.getCurrentUserProfile();
    const query = new Parse.Query(Parse.Object.extend('PostComment'));
    query.equalTo('post', postPointer);
    query.include('profile', 'statistics');
    query.notEqualTo('status', ApiObjectStatus.DELETED);

    const results = await query.find();
    console.log(
      $FUNC,
      `Found ${results.length} comment(s) for post '${postId}'`,
    );

    // const comments = results
    //   .map(result => {
    //     try {
    //       const comment = mapResultToComment(result, myProfile?.id);
    //       return comment;
    //     } catch (error) {
    //       return null;
    //     }
    //   })
    //   .filter((comment): comment is Comment => !!comment);
    //
    // return comments;

    return results.map(result => mapResultToComment(result, myProfile?.id));
  }

  export type FetchRepliesForCommentParams = {
    commentId: CommentId;
  };

  export async function fetchRepliesForComment(
    _: FetchRepliesForCommentParams,
  ): Promise<CommentReply[]> {
    throw new Error('Unimplemented: CommentApi.fetchRepliesForComment');
  }

  //#endregion READ OPERATIONS

  //#region CREATE OPERATIONS

  export type AddCommentForPostParams = {
    postId: PostId;
    message: string;
  };

  export async function addCommentForPost(
    params: AddCommentForPostParams,
  ): Promise<Comment> {
    const myProfile = await UserApi.getCurrentUserProfile();
    const result = await Parse.Cloud.run('createComment', params);
    return mapResultToComment(result, myProfile?.id);
  }

  export type UpdateCommentLikeStatusParams = {
    commentId: CommentId;
    didLike: boolean;
  };

  export async function updateCommentLikeStatus(
    params: UpdateCommentLikeStatusParams,
  ) {
    await Parse.Cloud.run('updateCommentLikeStatus', params);
  }

  //#endregion CREATE OPERATIONS

  //#region DELETE OPERATIONS

  type DeleteCommentParams = {
    commentId: CommentId;
  };

  export async function deleteComment(params: DeleteCommentParams) {
    await Parse.Cloud.run('deleteComment', params);
  }

  //#endregion DELETE OPERATIONS
}
