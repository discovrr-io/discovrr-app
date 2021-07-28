import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { PURGE } from 'redux-persist';

import { ApiFetchStatus, PostApi } from '../../api';
import { Post, PostId, ProfileId } from '../../models';
import { Pagination } from '../../models/common';
import { RootState } from '../../store';
import { selectProfileById } from '../profiles/profilesSlice';

type FetchAllPostsParams = {
  pagination?: Pagination;
  reload?: boolean;
};

export const fetchAllPosts = createAsyncThunk(
  'posts/fetchAllPosts',
  async ({ pagination }: FetchAllPostsParams = {}) =>
    PostApi.fetchAllPosts(pagination),
);

export const fetchPostsForProfile = createAsyncThunk(
  'posts/fetchPostsForProfile',
  async (postId: PostId) => PostApi.fetchPostsForProfile(String(postId)),
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async (postId: PostId) => PostApi.fetchPostById(String(postId)),
);

type ChangePostLikeStatusParams = {
  postId: PostId;
  didLike: boolean;
};

export const changePostLikeStatus = createAsyncThunk(
  'posts/changePostLikeStatus',
  async ({ postId, didLike }: ChangePostLikeStatusParams) =>
    PostApi.changePostLikeStatus(String(postId), didLike),
);

type UpdatePostViewCounterParams = {
  postId: PostId;
  lastViewed?: string;
};

export const updatePostViewCounter = createAsyncThunk(
  'posts/updatePostViewCounter',
  async ({ postId }: UpdatePostViewCounterParams) =>
    PostApi.updatePostViewCounter(String(postId)),
);

export type PostsState = EntityState<Post> & ApiFetchStatus;

const postsAdapter = createEntityAdapter<Post>({
  // Sort by newest post (this probably shouldn't be needed)
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

const initialState = postsAdapter.getInitialState<ApiFetchStatus>({
  status: 'idle',
});

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postLikeStatusChanged: (
      state,
      action: PayloadAction<{ postId: PostId; didLike: boolean }>,
    ) => {
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
      .addCase(PURGE, (state) => {
        console.log('Purging posts...');
        Object.assign(state, initialState);
      })
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
      .addCase(fetchPostsForProfile.pending, (state) => {
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
} = postsAdapter.getSelectors<RootState>((state) => state.posts);

// Memoized: selectPostsByProfile(state, profileId)
export const selectPostsByProfile = createSelector(
  [selectAllPosts, (_state: RootState, profileId: ProfileId) => profileId],
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
