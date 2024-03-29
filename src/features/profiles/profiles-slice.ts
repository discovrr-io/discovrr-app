import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  EntityState,
  PayloadAction,
} from '@reduxjs/toolkit';
import { BaseThunkAPI } from '@reduxjs/toolkit/dist/createAsyncThunk';

import { resetAppState } from 'src/global-actions';
import { AppDispatch, RootState } from 'src/store';

import {
  ApiFetchStatus,
  ApiFetchStatuses,
  ProfileApi,
  Reloadable,
} from 'src/api';

import {
  registerNewAccount,
  selectCurrentUserProfileId,
  signInWithCredential,
  signInWithEmailAndPassword,
} from 'src/features/authentication/auth-slice';

import {
  PersonalProfile,
  Profile,
  ProfileId,
  VendorProfile,
  VendorProfileId,
} from 'src/models';

//#region Profile Adapter Initialization

type ProfileApiFetchStatuses = ApiFetchStatuses<ProfileId>;
type ProfileApiCachedUsernames = { usernames: Record<string, ProfileId> };

export type ProfilesState = EntityState<Profile> &
  ProfileApiFetchStatuses &
  ProfileApiCachedUsernames;

const profilesAdapter = createEntityAdapter<Profile>({
  // We DO NOT want to index by `profile.id`
  selectId: profile => profile.profileId,
});

const initialState = profilesAdapter.getInitialState<
  ProfileApiFetchStatuses & ProfileApiCachedUsernames
>({
  statuses: {},
  usernames: {},
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

export const fetchProfileByUsername = createAsyncThunk<
  Profile,
  Reloadable<ProfileApi.FetchProfileByUsernameParams>,
  { dispatch: AppDispatch; state: RootState }
>('profiles/fetchProfileByUsername', async ({ username, reload }, thunkApi) => {
  const maybeProfileId = thunkApi.getState().profiles.usernames[username];

  if (maybeProfileId) {
    const maybeProfile = thunkApi.getState().profiles.entities[maybeProfileId];
    if (maybeProfile) {
      // NOTE: We won't attempt to reload or fetch here
      return maybeProfile;
    } else {
      const fetchProfileByIdAction = fetchProfileById({
        profileId: maybeProfileId,
        reload: reload,
      });
      return await thunkApi.dispatch(fetchProfileByIdAction).unwrap();
    }
  }

  return await ProfileApi.fetchProfileByUsername({ username });
});

export const fetchAllProfiles = createAsyncThunk<
  Profile[],
  Reloadable<ProfileApi.FetchAllProfilesParams>
>('profiles/fetchAllProfiles', ProfileApi.fetchAllProfiles);

export const fetchAllProfilesByKind = createAsyncThunk(
  'profiles/fetchAllProfilesByKind',
  ProfileApi.fetchAllProfilesByKind,
);

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

export const fetchAllVerifiedVendors = createAsyncThunk(
  'profiles/fetchAllVerifiedVendors',
  ProfileApi.fetchAllVerifiedVendors,
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

const mapProfileIdAndUsername = (profile: Profile) =>
  [profile.profileId, profile.username] as const;

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
          state.usernames = {};
        } else {
          profilesAdapter.upsertMany(state, action.payload);
        }

        state.statuses = {};
        for (const [profileId, username] of action.payload.map(
          mapProfileIdAndUsername,
        )) {
          state.statuses[profileId] = { status: 'fulfilled' };
          state.usernames[username] = profileId;
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
        state.statuses[action.meta.arg.profileId] = { status: 'fulfilled' };
        state.usernames[action.payload.username] = action.meta.arg.profileId;
      })
      .addCase(fetchProfileById.rejected, (state, action) => {
        state.statuses[action.meta.arg.profileId] = {
          status: 'rejected',
          error: action.error,
        };
      })
      // -- fetchProfileByUsername --
      .addCase(fetchProfileByUsername.fulfilled, (state, action) => {
        profilesAdapter.upsertOne(state, action.payload);
        state.statuses[action.payload.profileId] = { status: 'fulfilled' };
        state.usernames[action.payload.username] = action.payload.profileId;
      })
      // -- fetchAllProfilesByKind --
      .addCase(fetchAllProfilesByKind.fulfilled, (state, action) => {
        profilesAdapter.upsertMany(state, action.payload);
        for (const [profileId, username] of action.payload.map(
          mapProfileIdAndUsername,
        )) {
          state.statuses[profileId] = { status: 'fulfilled' };
          state.usernames[username] = profileId;
        }
      })
      // -- fetchProfileForVendorProfileId --
      .addCase(fetchProfileByVendorProfileId.fulfilled, (state, action) => {
        profilesAdapter.upsertOne(state, action.payload);
        state.statuses[action.payload.profileId] = { status: 'fulfilled' };
        state.usernames[action.payload.username] = action.payload.profileId;
      })
      // -- fetchAllVerifiedVendors --
      .addCase(fetchAllVerifiedVendors.fulfilled, (state, action) => {
        profilesAdapter.upsertMany(state, action.payload);
        for (const [profileId, username] of action.payload.map(
          mapProfileIdAndUsername,
        )) {
          state.statuses[profileId] = { status: 'fulfilled' };
          state.usernames[username] = profileId;
        }
      })
      // -- updateProfile --
      .addCase(updateProfile.fulfilled, (state, action) => {
        const { profileId, changes } = action.meta.arg;

        // Delete all properties with `undefine`s. We still want to keep `null`s
        // to explicitly unset fields (such as the avatar).
        Object.keys(changes).forEach(key => {
          const typedKey = key as keyof typeof changes;
          if (changes[typedKey] === undefined) delete changes[typedKey];
        });

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
      })
      .addCase(changeProfileKind.fulfilled, (state, action) => {
        const updatedProfile = action.payload;
        profilesAdapter.updateOne(state, {
          id: updatedProfile.profileId,
          changes: updatedProfile,
        });
      })
      .addCase(signInWithCredential.fulfilled, (state, action) => {
        const { profile } = action.payload;
        profilesAdapter.upsertOne(state, profile);
      })
      .addCase(signInWithEmailAndPassword.fulfilled, (state, action) => {
        const { profile } = action.payload;
        profilesAdapter.upsertOne(state, profile);
      })
      .addCase(registerNewAccount.fulfilled, (state, action) => {
        const { profile } = action.payload;
        profilesAdapter.upsertOne(state, profile);
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
