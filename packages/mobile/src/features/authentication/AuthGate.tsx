import * as React from 'react';
import { Alert } from 'react-native';

import { LoadingOverlay } from 'src/components';
import { useAppDispatch, useAppSelector } from 'src/hooks';

import * as authSlice from './auth-slice';
import RootNavigator from './RootNavigator';
import OutdatedModal from './OutdatedModal';

export default function AuthGate() {
  const dispatch = useAppDispatch();
  const { user, status, didAbortSignOut } = useAppSelector(state => state.auth);

  React.useEffect(() => {
    if (didAbortSignOut) {
      Alert.alert(
        'You have been signed out',
        'Due to security reasons, we signed you out. Please sign back in again.',
        [
          {
            text: 'Dismiss',
            onPress: () => dispatch(authSlice.dismissAbortSignOutAlert()),
          },
        ],
      );
    }
  }, [dispatch, didAbortSignOut]);

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
