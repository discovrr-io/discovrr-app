import React, { useEffect } from 'react';
import { Alert, Platform } from 'react-native';

import messaging from '@react-native-firebase/messaging';
import { useLinkTo } from '@react-navigation/native';

import { HeaderIcon, PlaceholderScreen, RouteError } from 'src/components';
import { color, font } from 'src/constants';
import { setFCMRegistrationTokenForProfile } from 'src/features/notifications/notificationsSlice';
import { useMyProfileId } from 'src/features/profiles/hooks';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { RootStack } from 'src/navigation';

import MainNavigator from './MainNavigator';
import CreateItemNavigator from 'src/features/create/CreateItemNavigator';
import renderPostNavigator from 'src/features/posts/PostNavigator';
import renderProfileNavigator from 'src/features/profiles/ProfileNavigator';
import renderSettingsNavigator from 'src/features/settings/SettingsNavigator';

async function getFCMToken(): Promise<string> {
  const $FUNC = '[getFCMToken]';

  if (!messaging().isDeviceRegisteredForRemoteMessages) {
    // TODO: Does this throw an error if the user doesn't accept?
    console.log($FUNC, 'Registering device for remote messages...');
    await messaging().registerDeviceForRemoteMessages();
  }

  const token = await messaging().getToken();
  console.log($FUNC, 'Got FCM token:', token);
  return token;
}

export default function RootNavigator() {
  const $FUNC = '[RootNavigator]';
  const dispatch = useAppDispatch();
  const linkTo = useLinkTo();

  const myProfileId = useMyProfileId();
  const didRegisterFCMToken = useAppSelector(state => {
    return state.notifications.didRegisterFCMToken;
  });

  useEffect(() => {
    const unsubscribe = messaging().onMessage(remoteMessage => {
      console.log($FUNC, 'New message:', remoteMessage);

      const alertTitle = remoteMessage.notification?.title ?? 'New Message';
      const alertMessage = remoteMessage.notification?.body ?? 'No body';

      if (remoteMessage.data?.url) {
        const handleOnPress = () => {
          /* eslint-disable @typescript-eslint/no-non-null-assertion */
          console.log(`Navigating to ${remoteMessage.data!.url}...`);
          linkTo(remoteMessage.data!.url);
          /* eslint-enable @typescript-eslint/no-non-null-assertion */
        };

        Alert.alert(alertTitle, alertMessage, [
          { text: 'View', onPress: handleOnPress },
        ]);
      } else {
        Alert.alert(alertTitle, alertMessage);
      }
    });

    return unsubscribe;
  }, [linkTo]);

  useEffect(() => {
    // FIXME: This will be true even if the user switches accounts, which means
    // a new Installation object won't be created for the switched account.
    console.log($FUNC, 'Did register FCM token?', didRegisterFCMToken);
    console.log($FUNC, 'My profile ID:', myProfileId);

    // `myProfileId` should be defined (since we're authenticated by this
    // point), but we'll just check anyway just in case
    if (!didRegisterFCMToken && myProfileId)
      (async () => {
        try {
          console.log($FUNC, 'Will register FCM token...');
          const token = await getFCMToken();
          const action = setFCMRegistrationTokenForProfile({
            profileId: myProfileId,
            deviceToken: token,
            deviceType: Platform.select({ ios: 'ios', default: 'android' }),
          });
          await dispatch(action).unwrap();
        } catch (error) {
          console.warn($FUNC, 'Failed to register FCM token:', error);
        }
      })();
  }, [dispatch, didRegisterFCMToken, myProfileId]);

  return (
    <RootStack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerTintColor: color.black,
        headerBackTitleVisible: false,
        headerTitleStyle: font.defaultHeaderTitleStyle,
        headerLeft: props => <HeaderIcon.Back {...props} />,
      }}>
      {/* -- Header-less Navigators -- */}
      <RootStack.Group screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainNavigator} />
        <RootStack.Screen
          name="Create"
          component={CreateItemNavigator}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Group>

      {/* -- Item Navigators -- */}
      {renderPostNavigator()}
      {renderProfileNavigator()}

      {/* -- Drawer Navigators -- */}
      <RootStack.Screen name="Notifications" component={PlaceholderScreen} />
      <RootStack.Screen
        name="MyShopping"
        component={PlaceholderScreen}
        options={{ title: 'My Shopping' }}
      />
      <RootStack.Screen name="Saved" component={PlaceholderScreen} />
      {renderSettingsNavigator()}

      {/* -- Miscellaneous -- */}
      <RootStack.Screen
        name="RouteError"
        component={RouteError}
        options={{ title: 'Error' }}
      />
    </RootStack.Navigator>
  );
}
