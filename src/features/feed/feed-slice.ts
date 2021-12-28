import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { PostId } from 'src/models';
import { createPost } from 'src/features/posts/posts-slice';

export type TimestampedPostId = { postId: PostId; createdAt: string };
export type FeedState = EntityState<TimestampedPostId>;

const feedAdapter = createEntityAdapter<TimestampedPostId>({
  selectId: item => item.postId,
  sortComparer: (a, b) => b.createdAt.localeCompare(a.createdAt),
});

const initialState = feedAdapter.getInitialState();

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    refreshFeed: (state, action: PayloadAction<TimestampedPostId[]>) => {
      feedAdapter.setAll(state, action.payload);
    },
    addPostIdsToFeed: (state, action: PayloadAction<TimestampedPostId[]>) => {
      feedAdapter.upsertMany(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder.addCase(createPost.fulfilled, (state, action) => {
      const { id, createdAt } = action.payload;
      feedAdapter.upsertOne(state, { postId: id, createdAt });
    });
  },
});

export const { addPostIdsToFeed, refreshFeed } = feedSlice.actions;

export default feedSlice.reducer;
