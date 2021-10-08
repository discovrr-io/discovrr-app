import { Profile, ProfileId } from 'src/models';
import { TypedUseAsyncItem, useAppSelector, useAsyncItem } from 'src/hooks';

import {
  selectCurrentUserProfileId,
  selectIsCurrentUserProfile,
} from 'src/features/authentication/auth-slice';

import {
  fetchProfileById,
  selectProfileById,
  selectProfileStatusById,
} from './profiles-slice';

export const useProfile: TypedUseAsyncItem<ProfileId, Profile | undefined> =
  profileId => {
    return useAsyncItem(
      'profile',
      profileId,
      fetchProfileById({ profileId }),
      selectProfileById,
      selectProfileStatusById,
    );
  };

export function useMyProfileId(): ProfileId | undefined {
  return useAppSelector(selectCurrentUserProfileId);
}

/**
 * A custom hook to determine whether or not the provided profile is the
 * current user's profile.
 *
 * @param profileId The ID of the profile to check.
 * @returns Whether or not the given `profileID` matches the current user's
 * profile ID.
 */
export function useIsMyProfile(profileId: ProfileId): boolean {
  return useAppSelector(state => selectIsCurrentUserProfile(state, profileId));
}
