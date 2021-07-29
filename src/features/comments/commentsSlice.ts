import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
} from '@reduxjs/toolkit';

import { PURGE } from 'redux-persist';

import { ApiFetchStatus, CommentApi, PostApi } from '../../api';
import { Comment, PostId } from '../../models';
import { RootState } from '../../store';

export const fetchCommentsForPost = createAsyncThunk(
  'comments/fetchCommentsForPost',
  async (postId: PostId) => PostApi.fetchCommentsForPost(String(postId)),
);

type AddCommentForPostParams = {
  postId: PostId;
  message: string;
};

export const addCommentForPost = createAsyncThunk(
  'comments/addCommentForPost',
  async ({ postId, message }: AddCommentForPostParams) =>
    CommentApi.addCommentForPost(String(postId), message),
);

export type CommentsState = EntityState<Comment> & ApiFetchStatus;

const commentsAdapter = createEntityAdapter<Comment>({
  sortComparer: (a, b) => a.createdAt.localeCompare(b.createdAt),
});

const initialState = commentsAdapter.getInitialState<ApiFetchStatus>({
  status: 'idle',
});

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(PURGE, (state) => {
        console.log('Purging comments...');
        Object.assign(state, initialState);
      })
      // -- fetchCommentsForPost --
      .addCase(fetchCommentsForPost.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(fetchCommentsForPost.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        commentsAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchCommentsForPost.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // -- addCommentForPost --
      .addCase(addCommentForPost.pending, (state, _) => {
        state.status = 'pending';
      })
      .addCase(addCommentForPost.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        if (action.payload) {
          commentsAdapter.upsertOne(state, action.payload);
        }
      })
      .addCase(addCommentForPost.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      });
  },
});

export const {} = commentsSlice.actions;

export const {
  selectAll: selectAllComments,
  selectById: selectCommentById,
  selectIds: selectCommentIds,
} = commentsAdapter.getSelectors<RootState>((state) => state.comments);

export const selectCommentsForPost = createSelector(
  [selectAllComments, (_state: RootState, postId: PostId) => postId],
  (allComments, postId) => {
    return allComments
      .filter((comment) => comment.postId === postId)
      .map((comment) => comment.id);
  },
);

export default commentsSlice.reducer;
