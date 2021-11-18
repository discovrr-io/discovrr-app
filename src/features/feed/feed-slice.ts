import {
  createEntityAdapter,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { PostId } from 'src/models';
import { createPost } from 'src/features/posts/posts-slice';

export type TimestampedPostId = readonly [PostId, string];
export type FeedState = EntityState<TimestampedPostId>;

const postIdsAdapter = createEntityAdapter<TimestampedPostId>({
  selectId: item => item[0],
  sortComparer: (a, b) => b[1].localeCompare(a[1]),
});

const initialState = postIdsAdapter.getInitialState();

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {
    refreshFeed: (state, action: PayloadAction<TimestampedPostId[]>) => {
      postIdsAdapter.setAll(state, action.payload);
    },
    addPostIdsToFeed: (state, action: PayloadAction<TimestampedPostId[]>) => {
      postIdsAdapter.upsertMany(state, action.payload);
    },
  },
  extraReducers: builder => {
    builder.addCase(createPost.fulfilled, (state, action) => {
      const { id, createdAt } = action.payload;
      postIdsAdapter.upsertOne(state, [id, createdAt]);
    });
  },
});

export const { addPostIdsToFeed, refreshFeed } = feedSlice.actions;

export default feedSlice.reducer;
