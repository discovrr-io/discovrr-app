import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

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

//#region Notifications Adapter Initialization

export type NotificationsState = typeof initialState;

const notificationsAdapter = createEntityAdapter<Notification>({
  sortComparer: (a, b) => b.receivedAt.localeCompare(a.receivedAt),
});

const initialState = notificationsAdapter.getInitialState({
  didRegisterFCMToken: false,
});

//#endregion Notifications Adapter Initialization

//#region Notifications Slice

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    didReceiveNotification: (
      state,
      action: PayloadAction<Omit<Notification, 'read'>>,
    ) => {
      notificationsAdapter.addOne(state, { ...action.payload, read: false });
    },
    markAllNotificationsAsRead: state => {
      notificationsAdapter.updateMany(
        state,
        state.ids.map(id => ({ id, changes: { read: true } })),
      );
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

export const {
  selectAll: selectAllNotifications,
  selectById: selectNotificationById,
  selectIds: selectNotificationIds,
} = notificationsAdapter.getSelectors<RootState>(state => state.notifications);

export const selectUnreadNotificationsCount = createSelector(
  [selectAllNotifications],
  notifications => {
    return notifications.filter(it => !it.read).length;
  },
);

//#endregion Notifications Slice

export default notificationsSlice.reducer;
