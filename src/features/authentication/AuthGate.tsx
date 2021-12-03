import * as React from 'react';
import { Alert } from 'react-native';

import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import inAppMessaging from '@react-native-firebase/in-app-messaging';

import { LoadingOverlay } from 'src/components';
import { fetchProfileById } from 'src/features/profiles/profiles-slice';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { User } from 'src/models';

import * as authSlice from './auth-slice';
import RootNavigator from './RootNavigator';
import OutdatedModal from './OutdatedModal';

export default function AuthGate() {
  const $FUNC = '[AuthGate]';
  const dispatch = useAppDispatch();

  const { isAuthenticated, isFirstLogin, user, status, didAbortSignOut } =
    useAppSelector(state => state.auth);
  console.log($FUNC, 'Is authenticated?', isAuthenticated);

  React.useEffect(() => {
    if (didAbortSignOut) {
      Alert.alert(
        'We had to sign you out',
        'Due to security reasons, we had to sign you out. Please sign back in again.',
        [
          {
            text: 'Dismiss',
            onPress: () => dispatch(authSlice.dismissAbortSignOutAlert()),
          },
        ],
      );
    }
  }, [dispatch, didAbortSignOut]);

  React.useEffect(() => {
    async function fetchCurrentUserProfile(user: User) {
      try {
        crashlytics().log("Fetching current user's profile...");
        console.log($FUNC, "Fetching current user's profile...");

        const profileId = user.profileId;
        const fetchProfile = fetchProfileById({ profileId, reload: true });
        const profile = await dispatch(fetchProfile).unwrap();

        if (!profile)
          throw new Error(`No profile found with ID '${profileId}'`);

        console.log($FUNC, 'Setting up Firebase settings...');
        // We don't care if any of these fail...
        await analytics()
          .setUserId(String(profileId))
          .catch(error => {
            console.warn($FUNC, 'Failed to set Analytics user ID:', error);
          });
        await crashlytics()
          .setUserId(String(profileId))
          .catch(error => {
            console.warn($FUNC, 'Failed to set Crashlytics user ID:', error);
          });
        await inAppMessaging()
          .setMessagesDisplaySuppressed(false)
          .catch(error => {
            console.warn(
              $FUNC,
              'Failed to disable suppression of In App Messaging messages:',
              error,
            );
          });

        // Ideally this should be set when the user has gone through onboarding,
        // but since that isn't set up yet we'll manually call it here. This'll
        // also prevent the Firebase calls above to be called on every launch.
        dispatch(authSlice.dismissInfoModal());
      } catch (error) {
        const reportedError =
          error instanceof Error ? error : new Error(String(error));
        crashlytics().recordError(reportedError);
        console.error($FUNC, "Failed to fetch current user's profile:", error);

        // TODO: Handle this gracefully
        console.warn($FUNC, 'Aborting operation. Signing out...');
        await dispatch(authSlice.abortSignOut(error)).unwrap();
      }
    }

    if (isFirstLogin && !!user) fetchCurrentUserProfile(user);
  }, [dispatch, isFirstLogin, user]);

  return (
    <>
      {status === 'signing-out' && !!user && (
        <LoadingOverlay message="Signing you out.." />
      )}
      <RootNavigator />
      <OutdatedModal />
    </>
  );
}
