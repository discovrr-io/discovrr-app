import { RootState } from './store';
import * as authSlice from './features/authentication/auth-slice';
import * as profilesSlice from './features/profiles/profiles-slice';

export const selectCurrentUserProfile = (state: RootState) => {
  const maybeMyProfileId = authSlice.selectCurrentUserProfileId(state);
  return maybeMyProfileId
    ? profilesSlice.selectProfileById(state, maybeMyProfileId)
    : undefined;
};

/**
 * May be `undefined` if the user is not signed in, or if the profile for the
 * user is not available in the Redux store (e.g. when there was an error
 * fetching the profile).
 */
export const selectCurrentUserProfileKind = (state: RootState) => {
  return selectCurrentUserProfile(state)?.kind;
};
