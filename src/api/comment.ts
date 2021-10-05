import Parse from 'parse/react-native';

import { UserApi } from '.';
import { ApiError, CommonApiErrorCode, InternalObjectStatus } from './common';
import { Comment, CommentId, CommentReply, ProfileId } from 'src/models';

export namespace CommentApi {
  export type CommentApiErrorCode = CommonApiErrorCode | 'INVALID_COMMENT';
  export class CommentApiError extends ApiError<CommentApiErrorCode> {}

  export function mapResultToComment(
    result: Parse.Object,
    myProfileId?: string | undefined,
  ): Comment {
    const owner: Parse.Object | undefined = result.get('owner');
    if (!owner) {
      console.error(
        `Comment with ID '${result.id}' has no profile associated with it.`,
        'Aborting...',
      );

      throw new CommentApiError(
        'INVALID_COMMENT',
        'The provided comment had no owner associated with it.',
      );
    }

    const statistics: Parse.Object | undefined = result.get('statistics');
    const likersArray: string[] = statistics?.get('likersArray') ?? [];
    const viewersArray: string[] = statistics?.get('viewersArray') ?? [];

    const didLike = myProfileId
      ? likersArray.some(liker => liker === myProfileId)
      : false;

    return {
      id: result.id as CommentId,
      postId: result.get('post').id,
      profileId: owner.id as ProfileId,
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

  export async function fetchCommentById(commentId: string): Promise<Comment> {
    const myProfile = await UserApi.getCurrentUserProfile();
    const commentQuery = new Parse.Query(Parse.Object.extend('PostComment'));
    commentQuery.equalTo('objectId', commentId);
    commentQuery.include('statistics');
    commentQuery.notEqualTo('status', InternalObjectStatus.DELETED);

    const result = await commentQuery.first();
    if (!result)
      throw new CommentApiError(
        'NOT_FOUND',
        `No comment was found with the ID '${commentId}'`,
      );

    return mapResultToComment(result, myProfile?.id);
  }

  export async function fetchCommentsForPost(
    postId: string,
  ): Promise<Comment[]> {
    const $FUNC = '[CommentApi.fetchCommentsForPosts]';

    const postPointer: Parse.Pointer = {
      __type: 'Pointer',
      className: 'Post',
      objectId: postId,
    };

    const myProfile = await UserApi.getCurrentUserProfile();
    const query = new Parse.Query(Parse.Object.extend('PostComment'));
    query.equalTo('post', postPointer);
    query.include('owner', 'statistics');
    query.notEqualTo('status', InternalObjectStatus.DELETED);

    const results = await query.find();
    console.log(
      $FUNC,
      `Found ${results.length} comment(s) for post '${postId}'`,
    );

    const comments = results
      .map(result => {
        try {
          const comment = mapResultToComment(result, myProfile?.id);
          return comment;
        } catch (error) {
          return null;
        }
      })
      .filter((comment): comment is Comment => !!comment);

    return comments;
  }

  export async function fetchRepliesForComment(
    _commentId: string,
  ): Promise<CommentReply[]> {
    throw new Error('Unimplemented error');
    // return [];
  }

  export async function addCommentForPost(
    postId: string,
    message: string,
  ): Promise<Comment> {
    const myProfile = await UserApi.getCurrentUserProfile();
    const result = await Parse.Cloud.run('createComment', {
      postId,
      message,
    });

    return mapResultToComment(result, myProfile?.id);
  }

  export async function updateCommentLikeStatus(
    commentId: string,
    didLike: boolean,
  ) {
    await Parse.Cloud.run('updateCommentLikeStatus', { commentId, didLike });
  }

  export async function deleteComment(commentId: string) {
    const $FUNC = '[CommentApi.deleteComment]';
    console.log($FUNC, `Deleting comment with id '${commentId}'...`);
    const commentQuery = new Parse.Query(Parse.Object.extend('PostComment'));
    const comment = await commentQuery.get(commentId);
    await comment.save({ status: InternalObjectStatus.DELETED });
    console.log($FUNC, 'Successfully deleted comment');
  }
}
