import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { NotificationApi } from 'src/api';
import { resetAppState } from 'src/globalActions';
import { ProfileId } from 'src/models';

//#region Notifications Async Thunks

type SetFCMRegistrationTokenForProfileParams = Omit<
  NotificationApi.SetFCMRegistrationTokenForProfileParams,
  'profileId'
> & {
  profileId: ProfileId;
};

export const setFCMRegistrationTokenForProfile = createAsyncThunk(
  'settings/setFCMRegistrationTokenForProfile',
  async ({ profileId, ...rest }: SetFCMRegistrationTokenForProfileParams) =>
    await NotificationApi.setFCMRegistrationTokenForProfile({
      profileId: String(profileId),
      ...rest,
    }),
);

//#endregion Notifications Async Thunks

//#region Notifications Adapter Initialization

export type NotificationsState = {
  didRegisterFCMToken: boolean;
};

const initialState: NotificationsState = {
  didRegisterFCMToken: false,
};

//#endregion Notifications Adapter Initialization

//#region Notifications Slice

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(resetAppState, state => {
        console.log('Purging notifications...');
        Object.assign(state, initialState);
      })
      .addCase(setFCMRegistrationTokenForProfile.fulfilled, state => {
        state.didRegisterFCMToken = true;
      });
  },
});

export const {} = notificationsSlice.actions;

//#endregion Notifications Slice

export default notificationsSlice.reducer;
