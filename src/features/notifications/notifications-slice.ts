import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { NotificationApi } from 'src/api';
import { abortSignOut, signOut } from 'src/features/authentication/auth-slice';
import { resetAppState } from 'src/global-actions';
import { Notification } from 'src/models';
import { RootState } from 'src/store';

//#region Notifications Async Thunks

export const setFCMRegistrationTokenForSession = createAsyncThunk(
  'settings/setFCMRegistrationTokenForSession',
  NotificationApi.setFCMRegistrationTokenForSession,
);

//#endregion Notifications Async Thunks

//#region Notifications State Initialization

export type NotificationsState = {
  didRegisterFCMToken: boolean;
  allNotifications: Notification[];
};

const initialState: NotificationsState = {
  didRegisterFCMToken: false,
  allNotifications: [],
};

//#endregion Notifications State Initialization

//#region Notifications Slice

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    didReceiveNotification: (
      state,
      action: PayloadAction<Pick<Notification, 'id' | 'title' | 'message'>>,
    ) => {
      const newNotification = action.payload;
      state.allNotifications.push({ ...newNotification, read: false });
    },
    markAllNotificationsAsRead: state => {
      for (const notification of state.allNotifications) {
        notification.read = true;
      }
    },
  },
  extraReducers: builder => {
    builder
      .addCase(resetAppState, (state, action) => {
        const { shouldResetFCMRegistrationToken = false } = action.payload;
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

export const { didReceiveNotification, markAllNotificationsAsRead } =
  notificationsSlice.actions;

export function selectUnreadNotificationsCount(state: RootState) {
  return state.notifications.allNotifications.filter(it => !it.read).length;
}

//#endregion Notifications Slice

export default notificationsSlice.reducer;
