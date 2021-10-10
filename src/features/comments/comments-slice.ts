import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { resetAppState } from 'src/global-actions';
import { Comment, CommentId, PostId } from 'src/models';
import { RootState } from 'src/store';

import {
  ApiFetchStatus,
  ApiFetchStatuses,
  CommentApi,
  Reloadable,
} from 'src/api';

//#region Comment Adapter Initialization

type CommentApiFetchStatuses = ApiFetchStatuses<CommentId>;
export type CommentsState = EntityState<Comment> & CommentApiFetchStatuses;

const commentsAdapter = createEntityAdapter<Comment>();

const initialState = commentsAdapter.getInitialState<CommentApiFetchStatuses>({
  statuses: {},
});

//#endregion Comment Adapter Initialization

//#region Comment Async Thunks

export const fetchCommentById = createAsyncThunk<
  Comment,
  Reloadable<CommentApi.FetchCommentByIdParams>
>('comments/fetchCommentById', CommentApi.fetchCommentById, {
  condition: (
    { commentId, reload = false },
    { getState }: BaseThunkAPI<RootState, unknown>,
  ) => {
    if (reload) return true;
    const { status } = selectCommentStatusById(getState(), commentId);
    return (
      status !== 'fulfilled' && status !== 'pending' && status !== 'refreshing'
    );
  },
});

type FetchCommentsForPostParams = {
  postId: PostId;
  previousCommentIds?: CommentId[];
};

export const fetchCommentsForPost = createAsyncThunk(
  'comments/fetchCommentsForPost',
  async ({ postId }: FetchCommentsForPostParams) =>
    CommentApi.fetchCommentsForPost({ postId }),
);

export const addCommentForPost = createAsyncThunk(
  'comments/addCommentForPost',
  CommentApi.addCommentForPost,
);

export const updateCommentLikeStatus = createAsyncThunk(
  'comments/updateCommentLikeStatus',
  CommentApi.updateCommentLikeStatus,
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  CommentApi.deleteComment,
);

//#endregion Comment Async Thunks

//#region Comment Slice

const commentsSlice = createSlice({
  name: 'comments',
  initialState,
  reducers: {
    commentLikeStatusChanged: (
      state,
      action: PayloadAction<CommentApi.UpdateCommentLikeStatusParams>,
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
        state.statuses[commentId] = {
          status: reload ? 'refreshing' : 'pending',
        };
      })
      .addCase(fetchCommentById.fulfilled, (state, action) => {
        if (action.payload) commentsAdapter.upsertOne(state, action.payload);
        state.statuses[action.meta.arg.commentId] = {
          status: 'fulfilled',
        };
      })
      .addCase(fetchCommentById.rejected, (state, action) => {
        state.statuses[action.meta.arg.commentId] = {
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
          state.statuses[commentId as CommentId] = { status: 'fulfilled' };
        }
      })
      // -- addCommentForPost --
      .addCase(addCommentForPost.fulfilled, (state, action) => {
        if (action.payload) commentsAdapter.upsertOne(state, action.payload);
        state.statuses[action.payload.id] = { status: 'fulfilled' };
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
        commentsAdapter.removeOne(state, action.meta.arg.commentId);
        delete state.statuses[action.meta.arg.commentId];
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
