import { createEntityAdapter, createSlice } from '@reduxjs/toolkit';

const nearMePostsAdapter = createEntityAdapter();

/**
 * @typedef {import('../../api').ApiFetchStatus} ApiFetchStatus
 * @typedef {import('../../models').Merchant} Merchant
 * @typedef {import('../../models').Product} Product
 * @typedef {Merchant | Product} NearMeItem
 *
 * @typedef {import('@reduxjs/toolkit').EntityState<NearMeItem>} NearMeEntityState
 * @type {NearMeEntityState & ApiFetchStatus}
 */
const initialState = nearMePostsAdapter.getInitialState({
  status: 'idle',
});

export const nearMeSlice = createSlice({
  name: 'nearMe',
  initialState,
  reducers: {},
  extraReducers: (builder) => {},
});

export const {} = nearMeSlice.actions;

export default nearMeSlice.reducer;
