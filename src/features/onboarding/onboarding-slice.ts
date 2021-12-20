import {
  createAsyncThunk,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';

import { OnboardingApi } from 'src/api';
import { resetAppState } from 'src/global-actions';

import {
  registerNewAccount,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
} from 'src/features/authentication/auth-slice';
import { selectShouldRequestNotificationPermissions } from '../notifications/notifications-slice';
import { Platform } from 'react-native';
import { selectCurrentUserProfileKind } from 'src/global-selectors';

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
      .addCase(resetAppState, state => {
        console.log('Purging onboarding...');
        Object.assign(state, initialState);
      })
      .addCase(saveOnboardingSurveyResult.fulfilled, state => {
        state.didSetUpProfile = true;
      })
      .addCase(signInWithCredential.fulfilled, (state, action) => {
        const { profile } = action.payload;
        state.didSetUpProfile = profile.didSetUpProfile;
      })
      .addCase(signInWithEmailAndPassword.fulfilled, (state, action) => {
        const { profile } = action.payload;
        state.didSetUpProfile = profile.didSetUpProfile;
      })
      .addCase(registerNewAccount.fulfilled, (state, action) => {
        const { profile } = action.payload;
        state.didSetUpProfile = profile.didSetUpProfile;
      })
      // We'll assume that no one will frequently switch accounts on the same
      // device for now
      .addCase(signOut.fulfilled, state => {
        console.log('Resetting onboarding state on sign out...');
        Object.assign(state, initialState);
      });
  },
});

export const {} = onboardingSlice.actions;

export default onboardingSlice.reducer;

export const selectOnboardingPagesCount = createSelector(
  [selectShouldRequestNotificationPermissions, selectCurrentUserProfileKind],
  (requestNotificationPermission, currentUserProfileKind) => {
    console.log({ currentUserProfileKind, requestNotificationPermission });
    const defaultPageCount = 5;
    if (currentUserProfileKind === 'vendor') {
      return (
        defaultPageCount +
        Platform.select({
          ios: requestNotificationPermission ? 2 : 1,
          default: 1,
        })
      );
    } else {
      return defaultPageCount;
    }
  },
);
