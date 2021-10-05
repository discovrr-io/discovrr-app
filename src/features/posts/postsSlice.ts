import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { ApiFetchStatus, ApiFetchStatuses, PostApi } from 'src/api';
import { selectProfileById } from 'src/features/profiles/profilesSlice';
import { resetAppState } from 'src/globalActions';
import { Post, PostId, ProfileId } from 'src/models';
import { Pagination } from 'src/models/common';
import { RootState } from 'src/store';

//#region Post Adapter Initialization

export type PostsState = EntityState<Post> & ApiFetchStatuses;

const postsAdapter = createEntityAdapter<Post>({
  // Sort by newest post (this probably shouldn't be needed)
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

// TODO: Only cache the first N number of posts
const initialState = postsAdapter.getInitialState<ApiFetchStatuses>({
  statuses: {},
});

//#endregion Post Adapter Initialization

//#region Post Async Thunks

export const createPost = createAsyncThunk(
  'posts/createPost',
  async (contents: PostApi.CreatePostParams) => PostApi.createPost(contents),
);

type FetchPostByIdParams = {
  postId: PostId;
  reload?: boolean;
};

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async ({ postId }: FetchPostByIdParams) =>
    PostApi.fetchPostById(String(postId)),
  {
    condition: (
      { postId, reload = false },
      { getState }: BaseThunkAPI<RootState, unknown>,
    ) => {
      if (reload) return true;
      const { status } = selectPostStatusById(getState(), postId);
      return (
        status !== 'fulfilled' &&
        status !== 'pending' &&
        status !== 'refreshing'
      );
    },
  },
);

type FetchAllPostsParams = {
  pagination?: Pagination;
  reload?: boolean;
};

export const fetchAllPosts = createAsyncThunk(
  'posts/fetchAllPosts',
  async ({ pagination }: FetchAllPostsParams = {}) =>
    PostApi.fetchAllPosts(pagination),
);

type FetchPostsForProfileParams = {
  profileId: ProfileId;
  reload?: boolean;
};

export const fetchPostsForProfile = createAsyncThunk(
  'posts/fetchPostsForProfile',
  async ({ profileId }: FetchPostsForProfileParams) =>
    PostApi.fetchPostsForProfile(String(profileId)),
);

type UpdatePostLikeStatusParams = {
  postId: PostId;
  didLike: boolean;
  sendNotification?: boolean;
};

export const updatePostLikeStatus = createAsyncThunk(
  'posts/updatePostLikeStatus',
  async ({ postId, didLike, sendNotification }: UpdatePostLikeStatusParams) =>
    PostApi.updatePostLikeStatus(String(postId), didLike, sendNotification),
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

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async (postId: PostId) => PostApi.deletePost(String(postId)),
);

//#endregion Post Async Thunks

//#region Post Slice

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postLikeStatusChanged: (
      state,
      action: PayloadAction<UpdatePostLikeStatusParams>,
    ) => {
      const { postId, didLike } = action.payload;
      const selectedPost = state.entities[postId];
      if (selectedPost && selectedPost.statistics) {
        selectedPost.statistics.didLike = didLike;
        if (didLike) {
          selectedPost.statistics.totalLikes += 1;
        } else {
          const decremented = selectedPost.statistics.totalLikes - 1;
          selectedPost.statistics.totalLikes = Math.max(0, decremented);
        }
      }
    },
  },
  extraReducers: builder => {
    builder
      // -- resetAppState --
      .addCase(resetAppState, state => {
        console.log('Purging posts...');
        Object.assign(state, initialState);
      })
      // -- createPost --
      .addCase(createPost.fulfilled, (state, action) => {
        postsAdapter.addOne(state, action.payload);
        state.statuses[action.payload.id] = {
          status: 'fulfilled',
          error: undefined,
        };
      })
      // -- fetchAllPosts --
      .addCase(fetchAllPosts.pending, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};
        for (const postId of Object.keys(state.statuses)) {
          state.statuses[postId] = {
            status: reload ? 'refreshing' : 'pending',
            error: undefined,
          };
        }
      })
      .addCase(fetchAllPosts.fulfilled, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};

        if (reload) {
          postsAdapter.setAll(state, action.payload);
        } else {
          postsAdapter.upsertMany(state, action.payload);
        }

        state.statuses = {};
        for (const postId of action.payload.map(post => post.id)) {
          state.statuses[String(postId)] = { status: 'fulfilled' };
        }
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        for (const postId of Object.keys(state.statuses)) {
          state.statuses[postId] = {
            status: 'rejected',
            error: action.error,
          };
        }
      })
      // -- fetchPostsForProfile --
      // .addCase(fetchPostsForProfile.pending, (state, action) => {
      //   const { reload = false } = action.meta.arg;
      //   for (const postId of Object.keys(state.statuses)) {
      //     state.statuses[postId] = {
      //       status: reload ? 'refreshing' : 'pending',
      //     };
      //   }
      // })
      .addCase(fetchPostsForProfile.fulfilled, (state, action) => {
        postsAdapter.upsertMany(state, action.payload);
        for (const postId of action.payload.map(postId => postId.id)) {
          state.statuses[String(postId)] = {
            status: 'fulfilled',
            error: undefined,
          };
        }
      })
      // .addCase(fetchPostsForProfile.rejected, (state, action) => {
      //   for (const postId of Object.keys(state.statuses)) {
      //     state.statuses[postId] = {
      //       status: 'rejected',
      //       error: action.error,
      //     };
      //   }
      // })
      // -- fetchPostById --
      .addCase(fetchPostById.pending, (state, action) => {
        const { postId, reload } = action.meta.arg;
        state.statuses[String(postId)] = {
          status: reload ? 'refreshing' : 'pending',
          error: undefined,
        };
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        if (action.payload) postsAdapter.upsertOne(state, action.payload);
        state.statuses[String(action.meta.arg.postId)] = {
          status: 'fulfilled',
          error: undefined,
        };
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.statuses[String(action.meta.arg.postId)] = {
          status: 'rejected',
          error: action.error,
        };
      })
      // -- updatePostLikeStatus --
      .addCase(updatePostLikeStatus.pending, (state, action) => {
        postsSlice.caseReducers.postLikeStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(updatePostLikeStatus.rejected, (state, action) => {
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
      })
      // -- deletePost --
      .addCase(deletePost.fulfilled, (state, action) => {
        postsAdapter.removeOne(state, action.meta.arg);
      });
  },
});

export const {} = postsSlice.actions;

//#endregion Post Slice

//#region Custom Post Selectors

export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
} = postsAdapter.getSelectors<RootState>(state => state.posts);

export function selectPostStatusById(
  state: RootState,
  postId: PostId,
): ApiFetchStatus {
  return state.posts.statuses[String(postId)] ?? { status: 'idle' };
}

// Memoized: selectPostsByProfile(state, postId)
export const selectPostsByProfile = createSelector(
  [selectAllPosts, (_state: RootState, profileId: ProfileId) => profileId],
  (posts, postId) => posts.filter(post => post.profileId === postId),
);

export const selectFollowingPosts = createSelector(
  [selectAllPosts, selectProfileById],
  (posts, profile) => {
    const followingProfiles = profile?.following ?? [];
    if (followingProfiles.length < 1) return [];
    return posts.filter(post => followingProfiles.includes(post.profileId));
  },
);

//#endregion Custom Post Selectors

export default postsSlice.reducer;
