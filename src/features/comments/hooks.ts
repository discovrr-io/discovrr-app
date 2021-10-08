import { Comment, CommentId } from 'src/models';
import { TypedUseAsyncItem, useAsyncItem } from 'src/hooks';

import {
  fetchCommentById,
  selectCommentById,
  selectCommentStatusById,
} from './comment-slice';

export const useComment: TypedUseAsyncItem<CommentId, Comment | undefined> =
  commentId => {
    return useAsyncItem(
      'comment',
      commentId,
      fetchCommentById({ commentId }),
      selectCommentById,
      selectCommentStatusById,
    );
  };
