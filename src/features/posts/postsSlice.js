import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { PostApi } from '../../api';

export const fetchAllPosts = createAsyncThunk(
  'posts/fetchAllPosts',
  /**
   * @typedef {import('../../models/common').Pagination} Pagination
   * @param {{ pagination?: Pagination, reload?: boolean }=} param0
   */
  async ({ pagination } = {}) => PostApi.fetchAllPosts(pagination),
);

export const fetchPostsForProfile = createAsyncThunk(
  'posts/fetchPostsForProfile',
  /**
   * @typedef {import('../../models').ProfileId} ProfileId
   * @param {ProfileId} profileId
   */
  async (profileId) => PostApi.fetchPostsForProfile(String(profileId)),
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  PostApi.fetchPostById,
);

export const changePostLikeStatus = createAsyncThunk(
  'posts/changePostLikeStatus',
  /**
   * @typedef {import('../../models').PostId} PostId
   * @param {{ postId: PostId, didLike: boolean }} param0
   */
  async ({ postId, didLike }) => PostApi.changePostLikeStatus(postId, didLike),
);

export const updatePostViewCounter = createAsyncThunk(
  'products/updatePostViewCounter',
  /**
   * @param {{ postId: PostId, lastViewed?: string }} param0
   */
  async ({ postId }) => PostApi.updatePostViewCounter(String(postId)),
);

/**
 * @typedef {import('../../models').Post} Post
 * @type {import('@reduxjs/toolkit').EntityAdapter<Post>}
 */
const postsAdapter = createEntityAdapter({
  // Sort by newest post (this probably shouldn't be needed)
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

/**
 * @typedef {import('../../api').ApiFetchStatus} ApiFetchStatus
 * @typedef {import('@reduxjs/toolkit').EntityState<Post>} PostEntityState
 * @type {PostEntityState & ApiFetchStatus}
 */
const initialState = postsAdapter.getInitialState({
  status: 'idle',
});

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    /**
     * @typedef {{ postId: PostId, didLike: boolean }} Payload
     * @param {import('@reduxjs/toolkit').PayloadAction<Payload>} action
     */
    postLikeStatusChanged: (state, action) => {
      const { postId, didLike } = action.payload;
      const existingPost = state.entities[postId];
      if (existingPost && existingPost.statistics) {
        existingPost.statistics.didLike = didLike;
        existingPost.statistics.totalLikes += didLike ? 1 : -1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // -- fetchAllPosts --
      .addCase(fetchAllPosts.pending, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};
        state.status = reload ? 'refreshing' : 'pending';
      })
      .addCase(fetchAllPosts.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.error = null;
        const { reload = false } = action.meta.arg ?? {};
        if (reload) {
          postsAdapter.setAll(state, action.payload);
        } else {
          postsAdapter.upsertMany(state, action.payload);
        }
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // -- fetchPostsForProfile --
      .addCase(fetchPostsForProfile.pending, (state, action) => {
        state.status = 'pending';
      })
      .addCase(fetchPostsForProfile.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.error = null;
        postsAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchPostsForProfile.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // -- fetchPostById --
      .addCase(fetchPostById.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.error = null;
        postsAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // -- changePostLikeStatus --
      .addCase(changePostLikeStatus.pending, (state, action) => {
        postsSlice.caseReducers.postLikeStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(changePostLikeStatus.rejected, (state, action) => {
        const oldLike = !action.meta.arg.didLike;
        postsSlice.caseReducers.postLikeStatusChanged(state, {
          ...action,
          payload: { ...action.meta.arg, didLike: oldLike },
        });
      })
      // -- updatePostViewCounter --
      .addCase(updatePostViewCounter.fulfilled, (state, action) => {
        const { postId, lastViewed = new Date().toJSON() } = action.meta.arg;
        const selectedPost = state.entities[postId];
        if (selectedPost) {
          if (selectedPost.statistics) {
            selectedPost.statistics.totalViews += 1;
            selectedPost.statistics.lastViewed = lastViewed;
          } else {
            selectedPost.statistics = {
              didSave: false,
              didLike: false,
              totalLikes: 0,
              totalViews: 1,
              lastViewed: lastViewed,
            };
          }
        }
      });
  },
});

export const {
  /* postLikeStatusChanged */
} = postsSlice.actions;

// Generated selectors with new names
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
} = postsAdapter.getSelectors((state) => state.posts);

// Memoized: selectPostsByProfile(state, profileId)
export const selectPostsByProfile = createSelector(
  [selectAllPosts, (_state, profileId) => profileId],
  (posts, profileId) => posts.filter((post) => post.profileId === profileId),
);

export const selectFollowingPosts = createSelector(
  [selectAllPosts, (_state, profileId) => profileId],
  (posts, profile) => {
    const followingProfiles = profile?.following ?? [];
    if (followingProfiles.length < 1) return [];
    return posts.filter((post) => followingProfiles.includes(post.profileId));
  },
);

export default postsSlice.reducer;
