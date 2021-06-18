import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit';

// import AsyncStorage from '@react-native-community/async-storage';

const Parse = require('parse/react-native');
const EARLIEST_DATE = new Date('2020-10-30');

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

export const fetchPosts = createAsyncThunk(
  'posts/fetchPosts',
  /**
   * @param {boolean} _refresh
   * @returns {Promise<Post[]>}
   */
  async (_refresh, _) => {
    try {
      console.log('[fetchAllPosts] Fetching posts...');

      // const cachedPosts = await AsyncStorage.getItem('cachedPosts');
      // if (!refresh && cachedPosts) {
      //   return JSON.parse(cachedPosts);
      // }

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
          /** @type {import('../../models/post').PostType} */
          let postType;
          /** @type {import('../../models/post').PostMedia} */
          let postMedia = [];

          /** @type {{ width: number, height: number, url: string }[]} */
          const media = post.get('media') ?? [];

          if (media.length === 0) {
            postType = 'text';
          } else if (media.length === 1 && media[0].type !== 'image') {
            postType = 'video';
            postMedia = [{ ...media[0], uri: media[0].url }];
          } else {
            postType = 'images';
            postMedia = media.map((it) => ({ ...it, uri: it.url }));
          }

          const likersArray = post.get('likersArray') ?? [];
          const totalLikes = likersArray.length;
          const didLike = profile?.id
            ? likersArray.some((liker) => profile.id === liker)
            : false;

          return {
            id: post.id,
            profileId: post.get('profile')?.id,
            createdAt: post.createdAt.toJSON(),
            type: postType,
            caption: post.get('caption') ?? '',
            media: postMedia,
            location: post.get('location'),
            metrics: { didSave: false, didLike, totalLikes },
          };
        });

      // await AsyncStorage.setItem('cachedPosts', JSON.stringify(posts));
      console.log('[fetchAllPosts] Finished fetching posts');
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

export const { postLikeStatusChanged } = postsSlice.actions;

// Generated selectors with new names
export const {
  selectAll: selectAllPosts,
  selectById: selectPostById,
  selectIds: selectPostIds,
} = postsAdapter.getSelectors((state) => state.posts);

export default postsSlice.reducer;
