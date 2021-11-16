import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { LayoutRectangle } from 'react-native';
// import { FacadeBottomTabParamList } from 'src/navigation';

import { ProfileApi } from 'src/api';
import * as globalActions from 'src/global-actions';
import * as authSlice from '../authentication/auth-slice';

// type TabLayouts = Partial<
//   Record<keyof FacadeBottomTabParamList, LayoutRectangle>
// >;

export type OnboardingState = {
  didCompleteMainOnboarding: boolean;
};

const initialState: OnboardingState = {
  didCompleteMainOnboarding: false,
};

export const submitOnboardingResponse = createAsyncThunk(
  'onboarding/submitOnboardingResponse',
  ProfileApi.submitOnboardingResponse,
);

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
      .addCase(submitOnboardingResponse.fulfilled, state => {
        state.didCompleteMainOnboarding = true;
      })
      // We'll assume that no one will frequently switch accounts on the same
      // device for now
      .addCase(authSlice.signOut.fulfilled, state => {
        console.log('Resetting onboarding state on sign out...');
        Object.assign(state, initialState);
      });
  },
});

export const {} = onboardingSlice.actions;

export default onboardingSlice.reducer;
