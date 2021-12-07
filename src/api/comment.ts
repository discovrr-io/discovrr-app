import Parse from 'parse/react-native';

import { UserApi } from './user';
import { ApiError, CommonApiErrorCode, ApiObjectStatus } from './common';
import {
  Comment,
  CommentId,
  CommentReply,
  CommentReplyId,
  PostId,
  ProfileId,
} from 'src/models';

export namespace CommentApi {
  export type CommentApiErrorCode = CommonApiErrorCode | 'INVALID_COMMENT';
  export class CommentApiError extends ApiError<CommentApiErrorCode> {}

  function mapResultToComment(
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
      profileId: result.get('profile').id,
      createdAt: result.createdAt.toISOString(),
      message: result.get('message'),
      repliesCount: result.get('repliesCount') ?? 0,
      statistics: {
        didLike,
        likers: likersArray as ProfileId[],
        totalLikes: likersArray.length,
        totalViews: viewersArray.length,
      },
    };
  }

  function mapResultToCommentReply(
    result: Parse.Object,
    _myProfileId?: string | undefined,
  ): CommentReply {
    return {
      id: result.id as CommentReplyId,
      parent: result.get('parent').id,
      profileId: result.get('profile').id,
      createdAt: result.createdAt.toISOString(),
      message: result.get('message'),
      statistics: {
        didLike: false,
        likers: [],
        totalLikes: 0,
        totalViews: 0,
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
    params: FetchRepliesForCommentParams,
  ): Promise<CommentReply[]> {
    const { commentId } = params;
    const commentPointer: Parse.Pointer = {
      __type: 'Pointer',
      className: 'PostComment',
      objectId: String(commentId),
    };

    const myProfile = await UserApi.getCurrentUserProfile();
    const commentReplies = await new Parse.Query('PostCommentReply')
      .descending('createdAt')
      .equalTo('parent', commentPointer)
      .include('profile', 'statistics')
      .notEqualTo('status', ApiObjectStatus.DELETED)
      .find();

    return commentReplies.map(result =>
      mapResultToCommentReply(result, myProfile?.id),
    );
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
