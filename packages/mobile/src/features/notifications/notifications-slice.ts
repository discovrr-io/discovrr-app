import { Platform } from 'react-native';

import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
  PayloadAction,
} from '@reduxjs/toolkit';

import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';

import { NotificationApi } from 'src/api';
import { abortSignOut, signOut } from 'src/features/authentication/auth-slice';
import { resetAppState } from 'src/global-actions';
import { Notification, NotificationId } from 'src/models';
import { RootState } from 'src/store';

//#region Notifications Async Thunks

export const setFCMRegistrationTokenForSession = createAsyncThunk(
  'notifications/setFCMRegistrationTokenForSession',
  NotificationApi.setFCMRegistrationTokenForSession,
);

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  NotificationApi.fetchNotifications,
);

//#endregion Notifications Async Thunks

//#region Notifications Adapter Initialization

export type NotificationsState = typeof initialState;

const notificationsAdapter = createEntityAdapter<Notification>({
  sortComparer: (a, b) => b.receivedAt.localeCompare(a.receivedAt),
});

const initialState = notificationsAdapter.getInitialState({
  didRegisterFCMToken: false,
  authorizationStatus: messaging.AuthorizationStatus.NOT_DETERMINED,
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
      notificationsAdapter.upsertOne(state, { ...action.payload, read: false });
    },
    setAuthorizationStatus: (
      state,
      action: PayloadAction<FirebaseMessagingTypes.AuthorizationStatus>,
    ) => {
      state.authorizationStatus = action.payload;
    },
    markNotificationAsRead: (state, action: PayloadAction<NotificationId>) => {
      notificationsAdapter.updateOne(state, {
        id: action.payload,
        changes: { read: true },
      });
    },
    markAllNotificationsAsRead: state => {
      notificationsAdapter.updateMany(
        state,
        state.ids.map(id => ({ id, changes: { read: true } })),
      );
    },
    clearAllNotifications: state => {
      notificationsAdapter.removeAll(state);
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
          authorizationStatus: state.authorizationStatus,
          didRegisterFCMToken: shouldResetFCMRegistrationToken
            ? false
            : state.didRegisterFCMToken,
        });
      })
      .addCase(setFCMRegistrationTokenForSession.fulfilled, state => {
        state.didRegisterFCMToken = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        if (action.meta.arg.pagination.currentPage === 0) {
          notificationsAdapter.setAll(state, action.payload);
        } else {
          notificationsAdapter.upsertMany(state, action.payload);
        }
      })
      .addCase(signOut.fulfilled, state => {
        state.didRegisterFCMToken = false;
      })
      .addCase(abortSignOut.rejected, state => {
        state.didRegisterFCMToken = false;
      });
  },
});

export const {
  didReceiveNotification,
  setAuthorizationStatus,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  clearAllNotifications,
} = notificationsSlice.actions;

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

export const selectShouldRequestNotificationPermissions = createSelector(
  [(state: RootState) => state.notifications.authorizationStatus],
  authorizationStatus => {
    if (Platform.OS !== 'ios') return false;
    return (
      authorizationStatus === messaging.AuthorizationStatus.NOT_DETERMINED ||
      authorizationStatus === messaging.AuthorizationStatus.DENIED
    );
  },
);

//#endregion Notifications Slice

export default notificationsSlice.reducer;
