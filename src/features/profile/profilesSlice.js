import {
  createAsyncThunk,
  createEntityAdapter,
  createSlice,
} from '@reduxjs/toolkit';

const Parse = require('parse/react-native');
const defaultAvatar = require('../../../resources/images/defaultAvatar.jpeg');

/**
 * @typedef {import('../../models').Profile} Profile
 * @type {import('@reduxjs/toolkit').EntityAdapter<Profile>}
 */
const profilesAdapter = createEntityAdapter();

/**
 * @typedef {import('../../models').FetchStatus} FetchStatus
 * @typedef {import('@reduxjs/toolkit').EntityState<Profile>} ProfileEntityState
 * @type {ProfileEntityState & FetchStatus}
 */
const initialState = profilesAdapter.getInitialState({
  status: 'idle',
});

export const fetchProfiles = createAsyncThunk(
  'profiles/fetchProfiles',
  /**
   * @returns {Promise<Profile[]>}
   */
  async () => {
    try {
      console.log('[fetchAllProfiles] Fetching profiles...');
      const query = new Parse.Query('Profile');
      const results = await query.findAll();
      const profiles = results.map((profile) => {
        const avatar = profile.get('avatar');
        return {
          id: profile.id,
          email: profile.get('email') ?? '',
          fullName:
            profile.get('fullName') ||
            profile.get('name') ||
            profile.get('displayName') ||
            '',
          username: profile.get('username') ?? '',
          isVendor: false,
          avatar: avatar ? { ...avatar, uri: avatar.url } : defaultAvatar,
          description: profile.get('description'),
          oneSignalPlayerIds: profile.get('oneSignalPlayerIds'),
        };
      });

      console.log('[fetchAllProfiles] Finished fetching profiles');
      return profiles;
    } catch (error) {
      console.error('[fetchAllProfiles] Failed to fetch profiles:', error);
      throw error;
    }
  },
);

const profilesSlice = createSlice({
  name: 'profiles',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfiles.pending, (state, _) => {
        state.status = 'pending';
      })
      .addCase(fetchProfiles.fulfilled, (state, action) => {
        state.status = 'fulfilled';
        profilesAdapter.upsertMany(state, action.payload);
      })
      .addCase(fetchProfiles.rejected, (state, action) => {
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
