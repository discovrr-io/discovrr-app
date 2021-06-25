import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit';

import { CommentApi, PostApi } from '../../api';

export const fetchCommentsForPost = createAsyncThunk(
  'comments/fetchCommentsForPost',
  PostApi.fetchCommentsForPost,
);

export const addCommentForPost = createAsyncThunk(
  'comments/addCommentForPost',
  async ({ postId, message }, _) =>
    CommentApi.addCommentForPost(postId, message),
);

/**
 * @typedef {import('../../models').Comment} Comment
 * @type {import('@reduxjs/toolkit').EntityAdapter<Comment>}
 */
const commentsAdapter = createEntityAdapter();

/**
 * @typedef {import('../../api').ApiFetchStatus} ApiFetchStatus
 * @typedef {import('@reduxjs/toolkit').EntityState<Comment>} CommentEntityState
 * @type {CommentEntityState & ApiFetchStatus}
 */
const initialState = commentsAdapter.getInitialState({
  status: 'idle',
});

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
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
} = commentsAdapter.getSelectors((state) => state.comments);

export default commentsSlice.reducer;
