import { Post, PostId } from 'src/models';
import { TypedUseAsyncItem, useAsyncItem } from 'src/hooks';

import {
  fetchPostById,
  selectPostById,
  selectPostStatusById,
} from './postsSlice';

export const usePost: TypedUseAsyncItem<PostId, Post | undefined> = postId => {
  return useAsyncItem(
    'post',
    postId,
    fetchPostById({ postId }),
    selectPostById,
    selectPostStatusById,
  );
};
