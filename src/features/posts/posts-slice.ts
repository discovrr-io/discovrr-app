import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { ApiFetchStatus, ApiFetchStatuses, PostApi, Reloadable } from 'src/api';
import { selectProfileById } from 'src/features/profiles/profiles-slice';
import { resetAppState } from 'src/global-actions';
import { Post, PostId, ProfileId } from 'src/models';
import { RootState } from 'src/store';

//#region Post Adapter Initialization

type PostApiFetchStatuses = ApiFetchStatuses<PostId>;
export type PostsState = EntityState<Post> & PostApiFetchStatuses;

const postsAdapter = createEntityAdapter<Post>({
  // Sort by newest post (this probably shouldn't be needed)
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

// TODO: Only cache the first N number of posts
const initialState = postsAdapter.getInitialState<PostApiFetchStatuses>({
  statuses: {},
});

//#endregion Post Adapter Initialization

//#region Post Async Thunks

export const createPost = createAsyncThunk(
  'posts/createPost',
  PostApi.createPost,
);

export const fetchPostById = createAsyncThunk<
  Post,
  Reloadable<PostApi.FetchPostByIdParams>
>('posts/fetchPostById', PostApi.fetchPostById, {
  condition: (
    { postId, reload = false },
    { getState }: BaseThunkAPI<RootState, unknown>,
  ) => {
    if (reload) return true;
    const { status } = selectPostStatusById(getState(), postId);
    return (
      status !== 'fulfilled' && status !== 'pending' && status !== 'refreshing'
    );
  },
});

export const fetchAllPosts = createAsyncThunk<
  Post[],
  Reloadable<PostApi.FetchAllPostsParams>
>('posts/fetchAllPosts', PostApi.fetchAllPosts);

export const fetchMorePosts = createAsyncThunk<
  Post[],
  PostApi.FetchMorePostsParams
>('posts/fetchMorePosts', PostApi.fetchMorePosts);

export const fetchPostsForProfile = createAsyncThunk<
  Post[],
  Reloadable<PostApi.FetchPostsForProfileParams>
>('posts/fetchPostsForProfile', PostApi.fetchPostsForProfile);

export const updatePostLikeStatus = createAsyncThunk(
  'posts/updatePostLikeStatus',
  PostApi.updatePostLikeStatus,
);

export const updatePostViewCounter = createAsyncThunk(
  'posts/updatePostViewCounter',
  PostApi.updatePostViewCounter,
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  PostApi.deletePost,
);

//#endregion Post Async Thunks

//#region Post Slice

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    postLikeStatusChanged: (
      state,
      action: PayloadAction<PostApi.UpdatePostLikeStatusParams>,
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
      // -- fetchPostById --
      .addCase(fetchPostById.pending, (state, action) => {
        const { postId, reload } = action.meta.arg;
        state.statuses[postId] = {
          status: reload ? 'refreshing' : 'pending',
          error: undefined,
        };
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        if (action.payload) postsAdapter.upsertOne(state, action.payload);
        state.statuses[action.meta.arg.postId] = {
          status: 'fulfilled',
          error: undefined,
        };
      })
      .addCase(fetchPostById.rejected, (state, action) => {
        state.statuses[action.meta.arg.postId] = {
          status: 'rejected',
          error: action.error,
        };
      })
      // -- fetchAllPosts --
      .addCase(fetchAllPosts.pending, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};
        for (const postId of Object.keys(state.statuses)) {
          state.statuses[postId as PostId] = {
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
          state.statuses[postId] = { status: 'fulfilled' };
        }
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        for (const postId of Object.keys(state.statuses)) {
          state.statuses[postId as PostId] = {
            status: 'rejected',
            error: action.error,
          };
        }
      })
      // -- fetchPostsForProfile --
      .addCase(fetchPostsForProfile.fulfilled, (state, action) => {
        postsAdapter.upsertMany(state, action.payload);
        for (const postId of action.payload.map(postId => postId.id)) {
          state.statuses[postId] = {
            status: 'fulfilled',
            error: undefined,
          };
        }
      })
      // -- fetchMorePosts --
      .addCase(fetchMorePosts.fulfilled, (state, action) => {
        postsAdapter.upsertMany(state, action.payload);
        for (const postId of action.payload.map(post => post.id)) {
          state.statuses[postId] = { status: 'fulfilled' };
        }
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
      // .addCase(updatePostViewCounter.fulfilled, (state, action) => {
      //   const { postId, lastViewed = new Date().toJSON() } = action.meta.arg;
      //   const selectedPost = state.entities[postId];
      //   if (selectedPost) {
      //     if (selectedPost.statistics) {
      //       selectedPost.statistics.totalViews += 1;
      //       selectedPost.statistics.lastViewed = lastViewed;
      //     } else {
      //       selectedPost.statistics = {
      //         didSave: false,
      //         didLike: false,
      //         totalLikes: 0,
      //         totalViews: 1,
      //         lastViewed: lastViewed,
      //       };
      //     }
      //   }
      // })
      // -- deletePost --
      .addCase(deletePost.fulfilled, (state, action) => {
        postsAdapter.removeOne(state, action.meta.arg.postId);
        delete state.statuses[action.meta.arg.postId];
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
  return state.posts.statuses[postId] ?? { status: 'idle' };
}

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
