import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit';

import { ProfileApi } from '../../api';

export const fetchAllProfiles = createAsyncThunk(
  'profiles/fetchAllProfiles',
  ProfileApi.fetchAllProfiles,
);

/**
 * @typedef {import('../../models').Profile} Profile
 * @type {import('@reduxjs/toolkit').EntityAdapter<Profile>}
 */
const profilesAdapter = createEntityAdapter();

/**
 * @typedef {import('../../api').ApiFetchStatus} ApiFetchStatus
 * @typedef {import('@reduxjs/toolkit').EntityState<Profile>} ProfileEntityState
 * @type {ProfileEntityState & ApiFetchStatus}
 */
const initialState = profilesAdapter.getInitialState({
  status: 'idle',
});

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllProfiles.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(fetchAllProfiles.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        profilesAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchAllProfiles.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
        profilesAdapter.setAll(state, []); // Should we reset the post list?
      });
  },
});

export const {} = profilesSlice.actions;

export const {
  selectAll: selectAllProfiles,
  selectById: selectProfileById,
  selectIds: selectProfileIds,
} = profilesAdapter.getSelectors((state) => state.profiles);

export default profilesSlice.reducer;
