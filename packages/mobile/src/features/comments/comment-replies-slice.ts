import {
  createEntityAdapter,
  createSlice,
  EntityState,
} from '@reduxjs/toolkit';

import { PURGE } from 'redux-persist';

import { ApiFetchStatus } from 'src/api';
import { CommentReply } from 'src/models/comment';

//#region Comment Reply Adapter Initialization

// TODO: Use `ApiFetchStatuses`
export type CommentRepliesState = EntityState<CommentReply> & ApiFetchStatus;

const commentRepliesAdapter = createEntityAdapter<CommentReply>();

const initialState = commentRepliesAdapter.getInitialState<ApiFetchStatus>({
  status: 'idle',
});

//#endregion Comment Reply Adapter Initialization

//#region Comment Reply Async Thunks

//#endregion Comment Reply Async Thunks

//#region Comment Reply Slice

const commentRepliesSlice = createSlice({
  name: 'commentReplies',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder.addCase(PURGE, state => {
      console.log('Purging comment replies...');
      Object.assign(state, initialState);
    });
  },
});

export const {} = commentRepliesSlice.actions;

//#endregion Comment Reply Slice

//#region Custom Comment Reply Selectors

//#endregion Custom Comment Reply Selectors

export default commentRepliesSlice.reducer;
