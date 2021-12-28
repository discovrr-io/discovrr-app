import { Platform } from 'react-native';

import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import * as authSlice from 'src/features/authentication/auth-slice';
import * as notificationsSlice from 'src/features/notifications/notifications-slice';
import * as globalSelectors from 'src/global-selectors';
import * as globalActions from 'src/global-actions';
import { OnboardingApi } from 'src/api';

export const saveOnboardingSurveyResult = createAsyncThunk(
  'onboarding/saveOnboardingSurveyResult',
  OnboardingApi.saveOnboardingSurveyResult,
);

export type OnboardingState = {
  didSetUpProfile: boolean;
};

const initialState: OnboardingState = {
  didSetUpProfile: false,
};

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(globalActions.resetAppState, state => {
        console.log('Purging onboarding...');
        Object.assign(state, initialState);
      })
      .addCase(saveOnboardingSurveyResult.fulfilled, state => {
        state.didSetUpProfile = true;
      })
      .addCase(authSlice.signInWithCredential.fulfilled, (state, action) => {
        const { profile } = action.payload;
        state.didSetUpProfile = profile.didSetUpProfile;
      })
      .addCase(
        authSlice.signInWithEmailAndPassword.fulfilled,
        (state, action) => {
          const { profile } = action.payload;
          state.didSetUpProfile = profile.didSetUpProfile;
        },
      )
      .addCase(authSlice.registerNewAccount.fulfilled, (state, action) => {
        const { profile } = action.payload;
        state.didSetUpProfile = profile.didSetUpProfile;
      })
      // We'll assume that no one will frequently switch accounts on the same
      // device for now
      .addCase(authSlice.signOut.fulfilled, state => {
        Object.assign(state, initialState);
      });
  },
});

export const {} = onboardingSlice.actions;

export default onboardingSlice.reducer;

export const selectOnboardingPagesCount = createSelector(
  [
    notificationsSlice.selectShouldRequestNotificationPermissions,
    globalSelectors.selectCurrentUserProfileKind,
  ],
  (requestNotificationPermission, currentUserProfileKind) => {
    const defaultPageCount = 5;
    if (currentUserProfileKind === 'vendor') {
      // Add extra page count to set business name
      return (
        defaultPageCount +
        Platform.select({
          // Add extra page count if we need to request notification permission
          ios: requestNotificationPermission ? 2 : 1,
          default: 1,
        })
      );
    } else {
      return defaultPageCount;
    }
  },
);
