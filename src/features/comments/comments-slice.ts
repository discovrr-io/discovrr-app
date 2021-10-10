import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { ApiFetchStatus, ApiFetchStatuses, CommentApi } from 'src/api';
import { resetAppState } from 'src/global-actions';
import { Comment, CommentId, PostId } from 'src/models';
import { RootState } from 'src/store';

//#region Comment Adapter Initialization

export type CommentsState = EntityState<Comment> & ApiFetchStatuses<CommentId>;

const commentsAdapter = createEntityAdapter<Comment>();

const initialState = commentsAdapter.getInitialState<ApiFetchStatuses>({
  statuses: {},
});

//#endregion Comment Adapter Initialization

//#region Comment Async Thunks

type FetchCommentByIdParams = {
  commentId: CommentId;
  reload?: boolean;
};

export const fetchCommentById = createAsyncThunk(
  'comments/fetchCommentById',
  async ({ commentId }: FetchCommentByIdParams) =>
    CommentApi.fetchCommentById(String(commentId)),
  {
    condition: (
      { commentId, reload = false },
      { getState }: BaseThunkAPI<RootState, unknown>,
    ) => {
      if (reload) return true;
      const { status } = selectCommentStatusById(getState(), commentId);
      return (
        status !== 'fulfilled' &&
        status !== 'pending' &&
        status !== 'refreshing'
      );
    },
  },
);

type FetchCommentsForPostParams = {
  postId: PostId;
  previousCommentIds?: CommentId[];
};

export const fetchCommentsForPost = createAsyncThunk(
  'comments/fetchCommentsForPost',
  async ({ postId }: FetchCommentsForPostParams) =>
    CommentApi.fetchCommentsForPost(String(postId)),
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

type UpdateCommentLikeStatusParams = {
  commentId: CommentId;
  didLike: boolean;
};

export const updateCommentLikeStatus = createAsyncThunk(
  'comments/updateCommentLikeStatus',
  async ({ commentId, didLike }: UpdateCommentLikeStatusParams) =>
    CommentApi.updateCommentLikeStatus(String(commentId), didLike),
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async (commentId: CommentId) => CommentApi.deleteComment(String(commentId)),
);

//#endregion Comment Async Thunks

//#region Comment Slice

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    commentLikeStatusChanged: (
      state,
      action: PayloadAction<UpdateCommentLikeStatusParams>,
    ) => {
      const { commentId, didLike } = action.payload;
      const selectedComment = state.entities[commentId];
      if (selectedComment && selectedComment.statistics) {
        selectedComment.statistics.didLike = didLike;
        if (didLike) {
          selectedComment.statistics.totalLikes += 1;
        } else {
          const decremented = selectedComment.statistics.totalLikes - 1;
          selectedComment.statistics.totalLikes = Math.max(0, decremented);
        }
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(resetAppState, state => {
        console.log('Purging comments...');
        Object.assign(state, initialState);
      })
      // -- fetchCommentById --
      .addCase(fetchCommentById.pending, (state, action) => {
        const { commentId, reload } = action.meta.arg;
        state.statuses[String(commentId)] = {
          status: reload ? 'refreshing' : 'pending',
        };
      })
      .addCase(fetchCommentById.fulfilled, (state, action) => {
        if (action.payload) commentsAdapter.upsertOne(state, action.payload);
        state.statuses[String(action.meta.arg.commentId)] = {
          status: 'fulfilled',
        };
      })
      .addCase(fetchCommentById.rejected, (state, action) => {
        state.statuses[String(action.meta.arg.commentId)] = {
          status: 'rejected',
          error: action.error,
        };
      })
      // -- fetchCommentsForPost --
      .addCase(fetchCommentsForPost.fulfilled, (state, action) => {
        const { previousCommentIds = [] } = action.meta.arg;
        const newCommentIds = action.payload.map(comment => comment.id);

        // First, remove any invalid comments that may have been deleted since
        // the last time this thunk was run
        const commentsToRemove = previousCommentIds.filter(commentId => {
          return !newCommentIds.includes(commentId);
        });
        commentsAdapter.removeMany(state, commentsToRemove);

        // Finally, upsert the new comments
        commentsAdapter.upsertMany(state, action.payload);
        for (const commentId of Object.keys(state.statuses)) {
          state.statuses[commentId] = { status: 'fulfilled' };
        }
      })
      // -- addCommentForPost --
      .addCase(addCommentForPost.fulfilled, (state, action) => {
        if (action.payload) commentsAdapter.upsertOne(state, action.payload);
        state.statuses[String(action.payload.id)] = { status: 'fulfilled' };
      })
      // -- updateCommentLikeStatus --
      .addCase(updateCommentLikeStatus.pending, (state, action) => {
        commentsSlice.caseReducers.commentLikeStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(updateCommentLikeStatus.rejected, (state, action) => {
        const oldLike = !action.meta.arg.didLike;
        commentsSlice.caseReducers.commentLikeStatusChanged(state, {
          ...action,
          payload: { ...action.meta.arg, didLike: oldLike },
        });
      })
      // -- deleteComment --
      .addCase(deleteComment.fulfilled, (state, action) => {
        commentsAdapter.removeOne(state, action.meta.arg);
        delete state.statuses[action.meta.arg];
      });
  },
});

export const {} = commentsSlice.actions;

//#endregion Comment Slice

//#region Custom Comment Selectors

export const {
  selectAll: selectAllComments,
  selectById: selectCommentById,
  selectIds: selectCommentIds,
} = commentsAdapter.getSelectors<RootState>(state => state.comments);

export function selectCommentStatusById(
  state: RootState,
  commentId: CommentId,
): ApiFetchStatus {
  return state.comments.statuses[commentId] ?? { status: 'idle' };
}

export const selectCommentsForPost = createSelector(
  [selectAllComments, (_state: RootState, postId: PostId) => postId],
  (allComments, postId) => {
    return allComments
      .filter(comment => comment.postId === postId)
      .map(comment => comment.id);
  },
);

//#endregion Custom Comment Selectors

export default commentsSlice.reducer;
