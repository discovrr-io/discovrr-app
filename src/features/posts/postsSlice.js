import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { PostApi } from '../../api';

export const fetchAllPosts = createAsyncThunk(
  'posts/fetchPosts',
  PostApi.fetchAllPosts,
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  PostApi.fetchPostById,
);

export const fetchFollowingPosts = createAsyncThunk(
  'posts/fetchFollowingPosts',
  /**
   * @typedef {{ limit: number, skip?: number }} Pagination
   * @param {Pagination=} pagination
   * @returns {Promise<Post[]>}
   */
  async (pagination = undefined, _) => {
    try {
      // const query = new Parse.Query(Parse.Object.extend('Post'))
    } catch (error) {
      console.error(
        '[fetchFollowingPosts] Failed to fetch following posts:',
        error,
      );
      throw error;
    } finally {
      console.log('[fetchFollowingPosts] Finished fetching following posts');
    }
  },
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
     * @typedef {import('../../models').PostId} PostId
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
      .addCase(fetchAllPosts.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(fetchAllPosts.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.error = null;
        // postsAdapter.upsertMany(state, action.payload);
        postsAdapter.setAll(state, action.payload);
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        // postsAdapter.setAll(state, []); // Should we reset the post list?
      })
      // -- fetchFollowingPosts --
      .addCase(fetchFollowingPosts.pending, (state, _) => {
        state.status = 'pending';
      })
      .addCase(fetchFollowingPosts.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.error = null;
        postsAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchFollowingPosts.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        // postsAdapter.setAll(state, []); // Should we reset the post list?
      })
      // -- fetchPostById --
      .addCase(fetchPostById.pending, (state, _) => {
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
      });
  },
});

export const { postLikeStatusChanged } = postsSlice.actions;

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

export default postsSlice.reducer;
