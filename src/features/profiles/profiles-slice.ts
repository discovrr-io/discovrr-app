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
import { AppDispatch, RootState } from 'src/store';

import {
  ApiFetchStatus,
  ApiFetchStatuses,
  ProfileApi,
  Reloadable,
} from 'src/api';

import {
  PersonalProfile,
  Profile,
  ProfileId,
  VendorProfile,
  VendorProfileId,
} from 'src/models';

//#region Profile Adapter Initialization

type ProfileApiFetchStatuses = ApiFetchStatuses<ProfileId>;
export type ProfilesState = EntityState<Profile> & ProfileApiFetchStatuses;

const profilesAdapter = createEntityAdapter<Profile>({
  // We DO NOT want to index by `profile.id`
  selectId: profile => profile.profileId,
});

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

export const fetchProfileByVendorProfileId = createAsyncThunk<
  Profile,
  Reloadable<ProfileApi.FetchProfileByVendorProfileIdParams>,
  { dispatch: AppDispatch; state: RootState }
>(
  'profiles/fetchProfileByVendorProfileId',
  async ({ vendorProfileId, reload }, thunkApi) => {
    const vendorProfiles = selectAllVendorProfiles(thunkApi.getState());
    const maybeVendor = vendorProfiles.find(v => v.id === vendorProfileId);

    if (maybeVendor) {
      const maybeProfile =
        thunkApi.getState().profiles.entities[maybeVendor.profileId];

      if (maybeProfile) {
        return maybeProfile;
      } else {
        const fetchProfileAction = fetchProfileById({
          profileId: maybeVendor.profileId,
          reload,
        });
        return await thunkApi.dispatch(fetchProfileAction).unwrap();
      }
    }

    return await ProfileApi.fetchProfileByVendorProfileId({ vendorProfileId });
  },
);

export const fetchAllProfilesByKind = createAsyncThunk(
  'profiles/fetchAllProfilesByKind',
  ProfileApi.fetchAllProfilesByKind,
);

export const updateProfile = createAsyncThunk(
  'profiles/updateProfile',
  ProfileApi.updateProfile,
);

export const changeProfileKind = createAsyncThunk<
  Profile,
  ProfileApi.ChangeProfileKindParams
>('profiles/changeProfileKind', ProfileApi.changeProfileKind);

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
        profilesAdapter.upsertOne(state, action.payload);
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
      // -- fetchAllProfilesByKind --
      .addCase(fetchAllProfilesByKind.fulfilled, (state, action) => {
        profilesAdapter.upsertMany(state, action.payload);
        for (const profileId of action.payload.map(p => p.profileId)) {
          state.statuses[profileId] = { status: 'fulfilled' };
        }
      })
      // -- fetchProfileForVendorProfileId --
      .addCase(fetchProfileByVendorProfileId.fulfilled, (state, action) => {
        profilesAdapter.upsertOne(state, action.payload);
        state.statuses[action.payload.profileId] = { status: 'fulfilled' };
      })
      // -- updateProfile --
      .addCase(updateProfile.fulfilled, (state, action) => {
        type Writeable<T> = { -readonly [P in keyof T]: T[P] };

        const { profileId, changes } = action.meta.arg;
        const finalChanges: Partial<Writeable<Profile>> = {};

        if (changes.displayName) finalChanges.displayName = changes.displayName;
        if (changes.username) finalChanges.username = changes.username;
        if (changes.biography) finalChanges.biography = changes.biography;

        // Explicitly set a defined or null value if the avatar was changed
        if (changes.avatar !== undefined) finalChanges.avatar = changes.avatar;
        // Explicitly set a defined or null value if the background was changed
        if (changes.background !== undefined)
          finalChanges.background = changes.background;

        profilesAdapter.updateOne(state, {
          id: profileId,
          changes: finalChanges,
        });
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
      })
      .addCase(changeProfileKind.fulfilled, (state, action) => {
        const updatedProfile = action.payload;
        profilesAdapter.updateOne(state, {
          id: updatedProfile.profileId,
          changes: updatedProfile,
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

export const selectAllPersonalProfiles = createSelector(
  [selectAllProfiles],
  profiles => {
    const filtered = profiles.filter(profile => profile.kind === 'personal');
    return filtered as PersonalProfile[];
  },
);

export const selectAllVendorProfiles = createSelector(
  [selectAllProfiles],
  profiles => {
    const filtered = profiles.filter(profile => profile.kind === 'vendor');
    return filtered as VendorProfile[];
  },
);

export const selectProfileIdByVendorProfileId = createSelector(
  [
    selectAllVendorProfiles,
    (_state: RootState, vendorProfileId: VendorProfileId) => vendorProfileId,
  ],
  (vendorProfiles, vendorProfileId) => {
    const match = vendorProfiles.find(vendor => vendor.id === vendorProfileId);
    return match?.profileId;
  },
);

//#endregion Custom Profile Selectors

export default profilesSlice.reducer;
