import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

const Parse = require('parse/react-native');
const EARLIEST_DATE = new Date('2020-10-30');

/**
 * @param {Parse.Object<Parse.Attributes>} result
 * @param {string=} profileId
 * @returns {Post}
 */
function newPostFromQueryResult(result, profileId = undefined) {
  /** @type {import('../../models/post').PostType} */
  let postType;
  /** @type {import('../../models/post').PostMedia} */
  let postMedia = [];

  /** @type {{ width: number, height: number, url: string }[]} */
  const media = result.get('media') ?? [];

  if (media.length === 0) {
    postType = 'text';
  } else if (media.length === 1 && media[0].type !== 'image') {
    postType = 'video';
    postMedia = [{ ...media[0], uri: media[0].url }];
  } else {
    postType = 'images';
    postMedia = media.map((it) => ({ ...it, uri: it.url }));
  }

  const likersArray = result.get('likersArray') ?? [];
  const totalLikes = likersArray.length;
  const didLike = profileId
    ? likersArray.some((liker) => profileId === liker)
    : false;

  return {
    id: result.id,
    profileId: result.get('profile')?.id,
    createdAt: result.createdAt.toJSON(),
    type: postType,
    caption: result.get('caption') ?? '',
    media: postMedia,
    location: result.get('location'),
    metrics: { didSave: false, didLike, totalLikes },
  };
}

export const fetchAllPosts = createAsyncThunk(
  'posts/fetchPosts',
  /**
   * @typedef {{ limit: number, currentPage?: number }} Pagination
   * @param {{ pagination?: Pagination }=} param0
   * @returns {Promise<Post[]>}
   */
  async ({ pagination = undefined }, _) => {
    try {
      console.log('[fetchPosts] Fetching posts...');

      const currentUser = await Parse.User.currentAsync();
      const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
      profileQuery.equalTo('owner', currentUser);

      const profile = await profileQuery.first();
      console.log('[fetchPosts] Found Parse profile:', profile?.id);

      const query = new Parse.Query('Post');
      query.greaterThanOrEqualTo('createdAt', EARLIEST_DATE);
      query.descending('createdAt');

      if (pagination) {
        query.limit(pagination.limit);
        query.skip(pagination.limit * pagination.currentPage ?? 0);
      }

      const results = await query.find();

      // TODO: Filter out posts from blocked profiles
      const posts = results
        .filter((post) => {
          // We only want posts that have a 'profile' field
          return !!post.get('profile')?.id;
        })
        .map((post) => newPostFromQueryResult(post, profile.id));

      console.log('[fetchPosts] Finished fetching posts');
      return posts;
    } catch (error) {
      console.error('[fetchPosts] Failed to fetch posts:', error);
      throw error;
    }
  },
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  /**
   * @param {string} postId
   * @returns {Promise<Post | null>}
   */
  async (postId, _) => {
    try {
      console.log(`[fetchPostById] Fetching post with id '${postId}'...`);

      const currentUser = await Parse.User.currentAsync();
      const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
      profileQuery.equalTo('owner', currentUser);

      const profile = await profileQuery.first();
      console.log('[fetchPostById] Found Parse profile:', profile?.id);

      const query = new Parse.Query('Post');
      query.equalTo('objectId', postId);

      const result = await query.first();
      console.log('[fetchPostById] Finished fetching post');

      if (result) {
        return newPostFromQueryResult(result, profile.id);
      } else {
        return null;
      }
    } catch (error) {
      console.error(
        `[fetchPostById] Failed to fetch post with id '${postId}':`,
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
 * @typedef {import('../../models').FetchStatus} FetchStatus
 * @typedef {import('@reduxjs/toolkit').EntityState<Post>} PostEntityState
 * @type {PostEntityState & FetchStatus}
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
      if (existingPost && existingPost.metrics) {
        existingPost.metrics.didLike = didLike;
        existingPost.metrics.totalLikes += didLike ? 1 : -1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // -- fetchAllPosts --
      .addCase(fetchAllPosts.pending, (state, _) => {
        state.status = 'pending';
      })
      .addCase(fetchAllPosts.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        postsAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchAllPosts.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        postsAdapter.setAll(state, []); // Should we reset the post list?
      })
      // -- fetchPostById --
      .addCase(fetchPostById.pending, (state, _) => {
        state.status = 'pending';
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        state.status = 'fulfilled';
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
