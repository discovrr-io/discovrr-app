import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { ApiFetchStatus, ApiFetchStatuses, ProfileApi } from 'src/api';
import { selectCurrentUserProfileId } from 'src/features/authentication/auth-slice';
import { resetAppState } from 'src/global-actions';
import { Profile, ProfileId } from 'src/models';
import { Pagination } from 'src/models/common';
import { RootState } from 'src/store';

//#region Profile Adapter Initialization

export type ProfilesState = EntityState<Profile> & ApiFetchStatuses;

const profilesAdapter = createEntityAdapter<Profile>();

const initialState = profilesAdapter.getInitialState<ApiFetchStatuses>({
  statuses: {},
});

//#endregion Profile Adapter Initialization

//#region Profile Async Thunks

type FetchAllProfilesParams = {
  pagination?: Pagination;
  reload?: boolean;
};

export const fetchAllProfiles = createAsyncThunk(
  'profiles/fetchAllProfiles',
  async ({ pagination }: FetchAllProfilesParams = {}) =>
    ProfileApi.fetchAllProfiles(pagination),
);

type FetchProfileByIdParams = {
  profileId: ProfileId;
  reload?: boolean;
};

export const fetchProfileById = createAsyncThunk(
  'profiles/fetchProfileById',
  async ({ profileId }: FetchProfileByIdParams) =>
    ProfileApi.fetchProfileById(String(profileId)),
  {
    condition: (
      { profileId, reload = false },
      { getState }: BaseThunkAPI<RootState, unknown>,
    ) => {
      if (reload) return true;
      const { status } = selectProfileStatusById(getState(), profileId);
      return (
        status !== 'fulfilled' &&
        status !== 'pending' &&
        status !== 'refreshing'
      );
    },
  },
);

type UpdateProfileParams = {
  profileId: ProfileId;
  changes: ProfileApi.ProfileChanges;
};

export const updateProfile = createAsyncThunk(
  'profiles/updateProfile',
  async ({ profileId, changes }: UpdateProfileParams) =>
    ProfileApi.updateProfile(profileId.toString(), changes),
);

type UpdateProfileFollowStatusParams = {
  followeeId: ProfileId;
  followerId: ProfileId;
  didFollow: boolean;
};

export const updateProfileFollowStatus = createAsyncThunk(
  'profiles/updateProfileFollowStatus',
  async ({ followeeId, didFollow }: UpdateProfileFollowStatusParams) =>
    ProfileApi.updateProfileFollowStatus(followeeId.toString(), didFollow),
);

//#endregion Profile Async Thunks

//#region Profile Slice

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    profileFollowStatusChanged: (
      state,
      action: PayloadAction<{
        followeeId: ProfileId;
        followerId: ProfileId;
        didFollow: boolean;
      }>,
    ) => {
      const { didFollow, followeeId, followerId } = action.payload;
      const followee = state.entities[followeeId];
      const follower = state.entities[followerId];

      if (!followee || !follower) {
        console.warn('One of the following is undefined:', {
          followee,
          follower,
        });
        return;
      }

      if (didFollow) {
        // Update followee's followers list
        if (followee.followers) followee.followers.push(followerId);
        else followee.followers = [followerId];

        // Update follower's followings list
        if (follower.following) follower.following.push(followeeId);
        else follower.following = [followeeId];
      } else {
        // Remove from followee's followers list
        const followerIndex = followee.followers?.indexOf(followerId) ?? -1;
        if (followerIndex > -1) followee.followers?.splice(followerIndex, 1);

        // Remove from follower's followings list
        const followeeIndex = follower.following?.indexOf(followeeId) ?? -1;
        if (followeeIndex > -1) follower.following?.splice(followeeIndex, 1);
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(resetAppState, state => {
        console.log('Purging profiles...');
        Object.assign(state, initialState);
      })
      // -- fetchAllProfiles --
      // .addCase(fetchAllProfiles.pending, (state, action) => {
      //   const { reload = false } = action.meta.arg ?? {};
      //   for (const profileId of Object.keys(state.statuses)) {
      //     state.statuses[profileId] = {
      //       status: reload ? 'refreshing' : 'pending',
      //     };
      //   }
      // })
      .addCase(fetchAllProfiles.fulfilled, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};

        if (reload) {
          profilesAdapter.setAll(state, action.payload);
        } else {
          profilesAdapter.upsertMany(state, action.payload);
        }

        state.statuses = {};
        for (const profileId of action.payload.map(profile => profile.id)) {
          state.statuses[String(profileId)] = { status: 'fulfilled' };
        }
      })
      // .addCase(fetchAllProfiles.rejected, (state, action) => {
      //   for (const profileId of Object.keys(state.statuses)) {
      //     state.statuses[profileId] = {
      //       status: 'rejected',
      //       error: action.error,
      //     };
      //   }
      // })
      // -- fetchProfileById --
      .addCase(fetchProfileById.pending, (state, action) => {
        const { profileId, reload = false } = action.meta.arg;
        state.statuses[String(profileId)] = {
          status: reload ? 'refreshing' : 'pending',
        };
      })
      .addCase(fetchProfileById.fulfilled, (state, action) => {
        if (action.payload) profilesAdapter.upsertOne(state, action.payload);
        state.statuses[String(action.meta.arg.profileId)] = {
          status: 'fulfilled',
        };
      })
      .addCase(fetchProfileById.rejected, (state, action) => {
        state.statuses[String(action.meta.arg.profileId)] = {
          status: 'rejected',
          error: action.error,
        };
      })
      // -- updateProfile --
      .addCase(updateProfile.fulfilled, (state, action) => {
        const { profileId, changes } = action.meta.arg;
        profilesAdapter.updateOne(state, { id: profileId, changes });
      })
      // -- updateProfileFollowStatus --
      .addCase(updateProfileFollowStatus.pending, (state, action) => {
        profilesSlice.caseReducers.profileFollowStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(updateProfileFollowStatus.rejected, (state, action) => {
        const oldDidFollow = !action.meta.arg.didFollow;
        profilesSlice.caseReducers.profileFollowStatusChanged(state, {
          ...action,
          payload: { ...action.meta.arg, didFollow: oldDidFollow },
        });
      });
  },
});

export const {} = profilesSlice.actions;

//#endregion Profile Slice

//#region Custom Profile Selectors

export const {
  selectAll: selectAllProfiles,
  selectById: selectProfileById,
  selectIds: selectProfileIds,
} = profilesAdapter.getSelectors<RootState>(state => state.profiles);

export function selectProfileStatusById(
  state: RootState,
  profileId: ProfileId,
): ApiFetchStatus {
  return state.profiles.statuses[String(profileId)] ?? { status: 'idle' };
}

export const selectIsUserFollowingProfile = createSelector(
  [selectProfileById, selectCurrentUserProfileId],
  (profile, userProfileId) => {
    if (!profile || !userProfileId) return false;
    if (profile.id === userProfileId) return false;
    return (profile.followers ?? []).includes(userProfileId);
  },
);

//#endregion Custom Profile Selectors

export default profilesSlice.reducer;
