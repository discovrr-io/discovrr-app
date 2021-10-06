import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { NotificationApi } from 'src/api';
import { abortSignOut, signOut } from 'src/features/authentication/authSlice';
import { resetAppState } from 'src/globalActions';

//#region Notifications Async Thunks

export const setFCMRegistrationTokenForSession = createAsyncThunk(
  'settings/setFCMRegistrationTokenForSession',
  NotificationApi.setFCMRegistrationTokenForSession,
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

      .addCase(setFCMRegistrationTokenForSession.fulfilled, state => {
        state.didRegisterFCMToken = true;
      })
      .addCase(signOut.fulfilled, state => {
        state.didRegisterFCMToken = false;
      })
      .addCase(abortSignOut.rejected, state => {
        state.didRegisterFCMToken = false;
      });
  },
});

export const {} = notificationsSlice.actions;

//#endregion Notifications Slice

export default notificationsSlice.reducer;
