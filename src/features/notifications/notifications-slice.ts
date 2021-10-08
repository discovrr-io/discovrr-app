import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { NotificationApi } from 'src/api';
import { abortSignOut, signOut } from 'src/features/authentication/auth-slice';
import { resetAppState } from 'src/global-actions';

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
      .addCase(resetAppState, (state, action) => {
        const { shouldResetFCMRegistrationToken } = action.payload;
        console.log('Purging notifications...');
        console.log('Should reset FCM token?', shouldResetFCMRegistrationToken);
        Object.assign(state, {
          ...initialState,
          didRegisterFCMToken: shouldResetFCMRegistrationToken
            ? false
            : state.didRegisterFCMToken,
        });
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
