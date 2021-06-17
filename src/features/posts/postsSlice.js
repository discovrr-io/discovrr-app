import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit';

import AsyncStorage from '@react-native-community/async-storage';

const imagePlaceholder = require('../../../resources/images/imagePlaceholder.png');

const Parse = require('parse/react-native');
const EARLIEST_DATE = new Date('2020-10-30');

const postsAdapter = createEntityAdapter({
  // Sort by newest post (this probably shouldn't be needed)
  /** @param {Post} a, @param {Post} b */
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

/**
 * @typedef {import('@reduxjs/toolkit').EntityId} PostId
 * @typedef {import('../authentication/authSlice').ProfileId} ProfileId
 * @typedef {'text'|'images'|'video'} PostType
 * @typedef {{ didSave: boolean, didLike: boolean, totalLikes: number }} PostMetrics
 * @typedef {{ id: PostId, profileId: ProfileId, type: PostType, caption: string, createdAt: string, postPreview?: { source: any, dimensions: { height: number, width: number } }, metrics: PostMetrics }} Post
 *
 * @typedef {import('@reduxjs/toolkit').EntityState<Post>} PostEntityState
 * @typedef {import('../../constants/api').FetchStatus} FetchStatus
 * @type {PostEntityState & FetchStatus}
 */
const initialState = postsAdapter.getInitialState({
  status: 'idle',
});

export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  /**
   * @param {boolean} refresh
   * @returns {Promise<Post[]>}
   */
  async (refresh, _) => {
    try {
      console.log('[fetchAllPosts] Fetching posts...');
      const cachedPosts = await AsyncStorage.getItem('cachedPosts');

      if (!refresh && cachedPosts) {
        return JSON.parse(cachedPosts);
      }

      const currentUser = await Parse.User.currentAsync();
      const profileQuery = new Parse.Query(Parse.Object.extend('Profile'));
      profileQuery.equalTo('owner', currentUser);

      const profile = await profileQuery.first();
      console.log('[fetchAllPosts] Found Parse profile:', profile?.id);

      const query = new Parse.Query('Post');
      // query.limit(<LIMIT>);
      // query.skip(<LIMIT> * <CURRENT_PAGE_INDEX>);
      query.greaterThanOrEqualTo('createdAt', EARLIEST_DATE);
      query.descending('createdAt');

      // TODO: Limit query
      const results = await query.find();

      // TODO: Filter out posts from blocked profiles
      /** @type {Post[]} */
      const posts = results
        .filter((post) => {
          // We only want posts that have a 'profile' field (so we know who the
          // author of that particular post is).
          return !!post.get('profile')?.id;
        })
        .map((post) => {
          /** @type {PostType} */
          let postType;
          /** @type {any|null} */
          let postPreviewSource;
          /** @type {{ height: number, width: number }} */
          let postPreviewDimensions;

          /** @type {any[]} */
          const media = post.get('media') ?? [];

          if (media.length === 0) {
            postType = 'text';
            postPreviewSource = imagePlaceholder;
            postPreviewDimensions = { height: 600, width: 800 };
          } else if (media.length === 1 && media[0].type !== 'image') {
            postType = 'video';
            postPreviewSource = imagePlaceholder;
            postPreviewDimensions = { height: 600, width: 800 };
          } else {
            const imagePreview = media[0];
            postType = 'images';
            postPreviewSource = imagePreview;
            postPreviewDimensions = {
              width: imagePreview.width ?? 800,
              height: imagePreview.height ?? 600,
            };
          }

          const likersArray = post.get('likersArray') ?? [];
          const totalLikes = likersArray.length;
          const didLike = profile?.id
            ? likersArray.some((liker) => profile.id === liker)
            : false;

          return {
            id: post.id,
            profileId: post.get('profile')?.id,
            type: postType,
            caption: post.get('caption') ?? '',
            createdAt: post.createdAt.toJSON(),
            postPreview: {
              source: postPreviewSource,
              dimensions: postPreviewDimensions,
            },
            metrics: { didSave: false, didLike, totalLikes },
          };
        });

      console.log('[fetchAllPosts] Finished fetching posts');
      await AsyncStorage.setItem('cachedPosts', JSON.stringify(posts));
      return posts;
    } catch (error) {
      console.error('[fetchAllPosts] Failed to fetch posts:', error);
      throw error;
    }
  },
);

const postsSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    /**
     * @param {import('@reduxjs/toolkit').PayloadAction<{ postId: PostId, didLike: boolean }>} action
     */
    postLiked: (state, action) => {
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
      .addCase(fetchPosts.pending, (state, _) => {
        state.status = 'pending';
      })
      .addCase(fetchPosts.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        postsAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        postsAdapter.setAll(state, []); // Should we reset the post list?
      });
  },
});

export const { postLiked } = postsSlice.actions;

// Generated selectors with new names
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
} = postsAdapter.getSelectors((state) => state.posts);

export default postsSlice.reducer;
