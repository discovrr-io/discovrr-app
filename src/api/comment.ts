import Parse from 'parse/react-native';

import { Comment } from '../models';
import { UserApi } from './user';

export namespace CommentApi {
  export async function addCommentForPost(
    postId: string,
    message: string,
  ): Promise<Comment | null> {
    const FUNC = '[CommentApi.addCommentForPost]';

    // TODO: Don't do a try-catch here
    try {
      const currentUser = await Parse.User.currentAsync();
      const currentProfile = await UserApi.getCurrentUserProfile();

      const postQuery = new Parse.Query(Parse.Object.extend('Post'));
      const post = await postQuery.get(postId);

      if (!post) {
        console.warn(FUNC, 'Failed to find post with id:', postId);
        // TODO: Throw an error instead
        return null;
      } else {
        console.log(FUNC, 'Found post with ID:', post.id);
      }

      const PostComment = Parse.Object.extend('PostComment');
      const postComment = new PostComment();
      const comment: Parse.Object<Parse.Attributes> = await postComment.save({
        post,
        message,
        profile: currentProfile.toPointer(),
      });

      return {
        id: comment.id,
        postId: comment.get('post').id,
        profileId: currentProfile.id,
        createdAt: comment.createdAt.toJSON(),
        message,
      } as Comment;
    } catch (error) {
      console.error(FUNC, 'Failed to add comment for post:', error);
      throw error;
    }
  }
}
