import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';
import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { selectCurrentUserProfileId } from 'src/features/authentication/auth-slice';
import { resetAppState } from 'src/global-actions';
import { Profile, ProfileId } from 'src/models';
import { RootState } from 'src/store';

import {
  ApiFetchStatus,
  ApiFetchStatuses,
  ProfileApi,
  Reloadable,
} from 'src/api';

//#region Profile Adapter Initialization

type ProfileApiFetchStatuses = ApiFetchStatuses<ProfileId>;
export type ProfilesState = EntityState<Profile> & ProfileApiFetchStatuses;

const profilesAdapter = createEntityAdapter<Profile>();

const initialState = profilesAdapter.getInitialState<ProfileApiFetchStatuses>({
  statuses: {},
});

//#endregion Profile Adapter Initialization

//#region Profile Async Thunks

export const fetchProfileById = createAsyncThunk<
  Profile,
  Reloadable<ProfileApi.FetchProfileByIdParams>
>('profiles/fetchProfileById', ProfileApi.fetchProfileById, {
  condition: (
    { profileId, reload = false },
    { getState }: BaseThunkAPI<RootState, unknown>,
  ) => {
    if (reload) return true;
    const { status } = selectProfileStatusById(getState(), profileId);
    return (
      status !== 'fulfilled' && status !== 'pending' && status !== 'refreshing'
    );
  },
});

export const fetchAllProfiles = createAsyncThunk<
  Profile[],
  Reloadable<ProfileApi.FetchAllProfilesParams>
>('profiles/fetchAllProfiles', ProfileApi.fetchAllProfiles);

export const updateProfile = createAsyncThunk(
  'profiles/updateProfile',
  ProfileApi.updateProfile,
);

type UpdateProfileFollowStatusParams = {
  followeeId: ProfileId;
  followerId: ProfileId;
  didFollow: boolean;
};

export const updateProfileFollowStatus = createAsyncThunk(
  'profiles/updateProfileFollowStatus',
  async ({ followeeId, didFollow }: UpdateProfileFollowStatusParams) =>
    ProfileApi.updateProfileFollowStatus({ profileId: followeeId, didFollow }),
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
      .addCase(fetchAllProfiles.fulfilled, (state, action) => {
        const { reload = false } = action.meta.arg ?? {};

        if (reload) {
          profilesAdapter.setAll(state, action.payload);
        } else {
          profilesAdapter.upsertMany(state, action.payload);
        }

        state.statuses = {};
        for (const profileId of action.payload.map(p => p.profileId)) {
          state.statuses[profileId] = { status: 'fulfilled' };
        }
      })
      // -- fetchProfileById --
      .addCase(fetchProfileById.pending, (state, action) => {
        const { profileId, reload = false } = action.meta.arg;
        state.statuses[profileId] = {
          status: reload ? 'refreshing' : 'pending',
        };
      })
      .addCase(fetchProfileById.fulfilled, (state, action) => {
        if (action.payload) profilesAdapter.upsertOne(state, action.payload);
        state.statuses[action.meta.arg.profileId] = {
          status: 'fulfilled',
        };
      })
      .addCase(fetchProfileById.rejected, (state, action) => {
        state.statuses[action.meta.arg.profileId] = {
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
  return state.profiles.statuses[profileId] ?? { status: 'idle' };
}

export const selectIsUserFollowingProfile = createSelector(
  [selectProfileById, selectCurrentUserProfileId],
  (profile, userProfileId) => {
    if (!profile || !userProfileId) return false;
    if (!profile.followers) return false;
    if (profile.profileId === userProfileId) return false;
    return profile.followers.includes(userProfileId);
  },
);

//#endregion Custom Profile Selectors

export default profilesSlice.reducer;
