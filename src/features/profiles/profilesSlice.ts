import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';

import { PURGE } from 'redux-persist';
import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { ApiFetchStatus, ApiFetchStatuses, ProfileApi } from '../../api';
import { Profile, ProfileId } from '../../models';
import { Pagination } from '../../models/common';
import { RootState } from '../../store';

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
  async ({ profileId }: FetchProfileByIdParams) => {
    return ProfileApi.fetchProfileById(String(profileId));
  },
  {
    condition: (
      { profileId, reload = false },
      { getState }: BaseThunkAPI<RootState, unknown>,
    ) => {
      if (reload) return true;
      const { status } = selectProfileStatusById(getState(), profileId);
      // console.log('Current status:', status);
      return (
        status !== 'fulfilled' &&
        status !== 'pending' &&
        status !== 'refreshing'
      );
    },
  },
);

type ChangeProfileFollowStatusParams = {
  followeeId: ProfileId;
  followerId: ProfileId;
  didFollow: boolean;
};

export const changeProfileFollowStatus = createAsyncThunk(
  'profiles/changeProfileFollowStatus',
  async ({ followeeId, didFollow }: ChangeProfileFollowStatusParams) =>
    ProfileApi.changeProfileFollowStatus(followeeId.toString(), didFollow),
);

type EditProfileParams = {
  profileId: ProfileId;
  changes: ProfileApi.UpdateProfileChanges;
};

export const editProfile = createAsyncThunk(
  'profiles/editProfile',
  async ({ profileId, changes }: EditProfileParams) =>
    ProfileApi.updateProfile(profileId.toString(), changes),
);

export type ProfilesState = EntityState<Profile> & ApiFetchStatuses;

const profilesAdapter = createEntityAdapter<Profile>();

const initialState = profilesAdapter.getInitialState<ApiFetchStatuses>({
  statuses: {},
});

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {
    updateProfile: profilesAdapter.updateOne,
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
      .addCase(PURGE, (state) => {
        console.log('Purging profiles...');
        Object.assign(state, initialState);
      })
      // -- fetchAllProfiles --
      .addCase(fetchAllProfiles.pending, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};
        for (const profileId of Object.keys(state.statuses)) {
          state.statuses[profileId] = {
            status: reload ? 'refreshing' : 'pending',
          };
        }
      })
      .addCase(fetchAllProfiles.fulfilled, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};

        if (reload) {
          profilesAdapter.setAll(state, action.payload);
        } else {
          profilesAdapter.upsertMany(state, action.payload);
        }

        state.statuses = {};
        for (const profileId of action.payload.map((profile) => profile.id)) {
          state.statuses[String(profileId)] = { status: 'fulfilled' };
        }
      })
      .addCase(fetchAllProfiles.rejected, (state, action) => {
        for (const profileId of Object.keys(state.statuses)) {
          state.statuses[profileId] = {
            status: 'rejected',
            error: action.error,
          };
        }
      })
      // -- fetchProfileById --
      .addCase(fetchProfileById.pending, (state, action) => {
        const { profileId, reload = false } = action.meta.arg;
        state.statuses[String(profileId)] = {
          status: reload ? 'refreshing' : 'pending',
        };
      })
      .addCase(fetchProfileById.fulfilled, (state, action) => {
        state.statuses[String(action.meta.arg.profileId)] = {
          status: 'fulfilled',
        };
        profilesAdapter.upsertOne(state, action.payload);
      })
      .addCase(fetchProfileById.rejected, (state, action) => {
        state.statuses[String(action.meta.arg.profileId)] = {
          status: 'rejected',
          error: action.error,
        };
      })
      // -- changeProfileFollowStatus --
      .addCase(changeProfileFollowStatus.pending, (state, action) => {
        profilesSlice.caseReducers.profileFollowStatusChanged(state, {
          ...action,
          payload: action.meta.arg,
        });
      })
      .addCase(changeProfileFollowStatus.rejected, (state, action) => {
        const oldDidFollow = !action.meta.arg.didFollow;
        profilesSlice.caseReducers.profileFollowStatusChanged(state, {
          ...action,
          payload: { ...action.meta.arg, didFollow: oldDidFollow },
        });
      })
      // -- editProfile --
      .addCase(editProfile.fulfilled, (state, action) => {
        const { profileId, changes } = action.meta.arg;
        profilesSlice.caseReducers.updateProfile(state, {
          id: profileId,
          changes,
        });
      });
  },
});

export const { updateProfile } = profilesSlice.actions;

export const {
  selectAll: selectAllProfiles,
  selectById: selectProfileById,
  selectIds: selectProfileIds,
} = profilesAdapter.getSelectors<RootState>((state) => state.profiles);

export function selectProfileStatusById(
  state: RootState,
  profileId: ProfileId,
): ApiFetchStatus {
  return state.profiles.statuses[String(profileId)] ?? { status: 'idle' };
}

export const getIsFollowingProfile = createSelector(
  [selectProfileById, (_state, userProfileId) => userProfileId],
  (profile, userProfileId) => (profile.followers ?? []).includes(userProfileId),
);

export default profilesSlice.reducer;
