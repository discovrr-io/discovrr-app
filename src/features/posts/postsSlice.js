import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { PostApi } from '../../api';
import { selectProfileById } from '../profiles/profilesSlice';

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
   * @param {PostApi.Pagination=} pagination
   * @returns {Promise<Post[]>}
   */
  async (pagination, { getState }) => {
    try {
      /** @type {{ user: import('../../models').User }} */
      const { user } = getState().auth;
      if (!user) {
        console.warn(
          '[PostApi.fetchFollowingPosts]',
          'Current user is undefined. Is the user authenticated?',
        );
        return [];
      }

      const followingArray = user.profile.followers;
      if (!followingArray || followingArray.length < 1) {
        console.info(
          '[PostApi.fetchFollowingPosts]',
          'Current user is not following anyone. Returning early...',
        );
        return [];
      }

      // TODO: We could probably use a memoized selector instead
      return await PostApi.fetchFollowingPosts(
        user.profile.id,
        followingArray,
        pagination,
      );
    } catch (error) {
      console.error(
        '[PostApi.fetchFollowingPosts] Failed to fetch following posts:',
        error,
      );
      throw error;
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

export const selectFollowingPosts = createSelector(
  [selectAllPosts, selectProfileById],
  (posts, profile) => {
    const followingProfiles = profile?.following ?? [];
    if (followingProfiles.length < 1) return [];
    return posts.filter((post) => followingProfiles.includes(post.profileId));
  },
);

export default postsSlice.reducer;
