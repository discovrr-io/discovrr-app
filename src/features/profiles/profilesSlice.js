import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { ProfileApi } from '../../api';

export const fetchAllProfiles = createAsyncThunk(
  'profiles/fetchAllProfiles',
  ProfileApi.fetchAllProfiles,
);

export const fetchProfileById = createAsyncThunk(
  'profiles/fetchProfileById',
  ProfileApi.fetchProfileById,
);

// export const changeProfileFollowStatus = createAsyncThunk(
//   'profiles/changeProfileFollowStatus',
//   /**
//    * @param {{ profileId: string, isFollowing: boolean }} param0
//    */
//   async ({ profileId, isFollowing }) =>
//     ProfileApi.changeProfileFollowStatus(profileId, isFollowing),
// );

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
    didChangeFollowStatus: (state, action) => {
      const { didFollow, followeeId, followerId } = action.payload;
      const followee = state.entities[followeeId];
      const follower = state.entities[followerId];

      if (didFollow) {
        followee.followers.push(followerId);
        follower.following.push(followeeId);
      } else {
        // Remove from follower's list
        const followerIndex = followee.followers.indexOf(followerId);
        if (followerIndex > -1) followee.followers.splice(followerIndex, 1);

        // Remove from followee's list
        const followeeIndex = follower.following.indexOf(followeeId);
        if (followeeIndex > -1) follower.following.splice(followeeIndex, 1);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // -- fetchAllProfiles --
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
        // profilesAdapter.setAll(state, []); // Should we reset the post list?
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
      });
    // // -- changeProfileFollowStatus --
    // .addCase(changeProfileFollowStatus.pending, (state) => {
    //   state.status = 'pending';
    // })
    // .addCase(changeProfileFollowStatus.fulfilled, (state, action) => {
    //   state.status = 'fulfilled';
    // })
    // .addCase(changeProfileFollowStatus.rejected, (state, action) => {
    //   state.status = 'rejected';
    //   state.error = action.error;
    // });
  },
});

export const { updateProfile, didChangeFollowStatus } = profilesSlice.actions;

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
