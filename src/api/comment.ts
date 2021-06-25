import Parse from 'parse/react-native';

import { Comment } from '../models';

export namespace CommentApi {
  export async function addCommentForPost(
    postId: string,
    message: string,
  ): Promise<Comment | null> {
    try {
      console.group('CommentApi.addCommentForPost');
      const postQuery = new Parse.Query(Parse.Object.extend('Post'));
      postQuery.equalTo('objectId', postId);
      const post = await postQuery.first();

      if (!post) {
        console.warn('Failed to find post with id:', postId);
        return null;
      } else {
        console.log('Found post owner for comment:', post.id);
      }

      const PostComment = Parse.Object.extend('PostComment');
      const postComment = new PostComment();
      const comment: Parse.Object<Parse.Attributes> = await postComment.save({
        post,
        message,
      });

      return {
        id: comment.id,
        postId: comment.get('post').id,
        profileId: comment.get('profile').id,
        createdAt: comment.createdAt.toJSON(),
        message,
      } as Comment;
    } catch (error) {
      console.error('Failed to add comment for post:', error);
      throw error;
    } finally {
      console.groupEnd();
    }
  }
}
