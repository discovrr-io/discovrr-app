import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { ProfileApi } from '../../api';

export const fetchAllProfiles = createAsyncThunk(
  'profiles/fetchAllProfiles',
  /**
   * @typedef {import('../../models/common').Pagination} Pagination
   * @param {{ pagination?: Pagination, reload?: boolean }=} param0
   */
  async ({ pagination } = {}) => ProfileApi.fetchAllProfiles(pagination),
);

export const fetchProfileById = createAsyncThunk(
  'profiles/fetchProfileById',
  ProfileApi.fetchProfileById,
);

export const changeProfileFollowStatus = createAsyncThunk(
  'profiles/changeProfileFollowStatus',
  /**
   * @typedef {import('../../models').ProfileId} ProfileId
   * @param {{ followeeId: ProfileId, followerId: ProfileId, didFollow: boolean }} param0
   */
  async ({ followeeId, didFollow }) =>
    ProfileApi.changeProfileFollowStatus(followeeId, didFollow),
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
  reducers: {
    updateProfile: profilesAdapter.updateOne,
    /**
     * @typedef {{ followeeId: ProfileId, followerId: ProfileId, didFollow: boolean, }} Payload
     * @param {import('@reduxjs/toolkit').PayloadAction<Payload>} action
     */
    profileFollowStatusChanged: (state, action) => {
      const { didFollow, followeeId, followerId } = action.payload;
      const followee = state.entities[followeeId];
      const follower = state.entities[followerId];

      if (didFollow) {
        // Update followee's followers list
        if (followee.followers) followee.followers.push(followerId);
        else followee.followers = [followerId];

        // Update follower's followings list
        if (follower.following) follower.following.push(followeeId);
        else follower.following = [followeeId];
      } else {
        // Remove from followee's followers list
        const followerIndex = followee.followers?.indexOf(followerId);
        if (followerIndex > -1) followee.followers?.splice(followerIndex, 1);

        // Remove from follower's followings list
        const followeeIndex = follower.following?.indexOf(followeeId);
        if (followeeIndex > -1) follower.following?.splice(followeeIndex, 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // -- fetchAllProfiles --
      .addCase(fetchAllProfiles.pending, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};
        state.status = reload ? 'refreshing' : 'pending';
      })
      .addCase(fetchAllProfiles.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        state.error = null;
        const { reload = false } = action.meta.arg ?? {};
        if (reload) {
          profilesAdapter.setAll(state, action.payload);
        } else {
          profilesAdapter.upsertMany(state, action.payload);
        }
      })
      .addCase(fetchAllProfiles.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // -- fetchProfileById --
      .addCase(fetchProfileById.pending, (state) => {
        state.status = 'pending';
      })
      .addCase(fetchProfileById.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        profilesAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchProfileById.rejected, (state, action) => {
        state.status = 'rejected';
        state.error = action.error;
      })
      // -- changeProfileFollowStatus --
      .addCase(changeProfileFollowStatus.pending, (state, action) => {
        // state.status = 'pending';
        profilesSlice.caseReducers.profileFollowStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(changeProfileFollowStatus.rejected, (state, action) => {
        // state.status = 'rejected';
        const oldDidFollow = !action.meta.arg.isFollowing;
        profilesSlice.caseReducers.profileFollowStatusChanged(state, {
          ...action,
          payload: { ...action.meta.arg, didFollow: oldDidFollow },
        });
      });
  },
});

export const { updateProfile } = profilesSlice.actions;

export const {
  selectAll: selectAllProfiles,
  selectById: selectProfileById,
  selectIds: selectProfileIds,
} = profilesAdapter.getSelectors((state) => state.profiles);

export const getIsFollowingProfile = createSelector(
  [selectProfileById, (_state, userProfileId) => userProfileId],
  (profile, userProfileId) => (profile.followers ?? []).includes(userProfileId),
);

export default profilesSlice.reducer;
