import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import { resetAppState } from 'src/global-actions';
import { signOut } from 'src/features/authentication/auth-slice';
import { OnboardingApi } from 'src/api';

export const saveOnboardingSurveyResult = createAsyncThunk(
  'onboarding/saveOnboardingSurveyResult',
  OnboardingApi.saveOnboardingSurveyResult,
);

export type OnboardingState = {
  didCompleteMainOnboarding: boolean;
};

const initialState: OnboardingState = {
  didCompleteMainOnboarding: false,
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
        state.didCompleteMainOnboarding = true;
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
