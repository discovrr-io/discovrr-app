import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { LayoutRectangle } from 'react-native';
// import { FacadeBottomTabParamList } from 'src/navigation';

import { ProfileApi } from 'src/api';
import { resetAppState } from 'src/global-actions';
import { signOut } from '../authentication/auth-slice';

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
  async (params: ProfileApi.SubmitOnboardingResponse) => {
    if (params) await ProfileApi.submitOnboardingResponse(params);
  },
);

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
      .addCase(submitOnboardingResponse.fulfilled, state => {
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
