import React, { useEffect } from 'react';
import { Alert } from 'react-native';

import messaging from '@react-native-firebase/messaging';
import { useLinkTo } from '@react-navigation/native';

import { HeaderIcon, PlaceholderScreen, RouteError } from 'src/components';
import { color, font } from 'src/constants';
import { setFCMRegistrationTokenForSession } from 'src/features/notifications/notificationsSlice';
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

  const sessionId = useAppSelector(state => state.auth.sessionId);
  const didRegisterFCMToken = useAppSelector(state => {
    return state.notifications.didRegisterFCMToken;
  });

  useEffect(() => {
    const unsubscribe = messaging().onMessage(remoteMessage => {
      console.log($FUNC, 'New message:', remoteMessage);

      const alertTitle = remoteMessage.notification?.title ?? 'New Message';
      const alertMessage = remoteMessage.notification?.body ?? 'No body';

      if (remoteMessage.data?.destination) {
        const handleOnPress = () => {
          /* eslint-disable @typescript-eslint/no-non-null-assertion */
          console.log(`Navigating to ${remoteMessage.data!.destination}...`);
          linkTo(remoteMessage.data!.destination);
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
    console.log($FUNC, 'Did register FCM token?', didRegisterFCMToken);
    console.log($FUNC, 'Session ID:', sessionId);
    if (!sessionId) console.warn('Session ID is not set, which is unexpected');

    if (!didRegisterFCMToken && sessionId)
      (async () => {
        try {
          console.log($FUNC, 'Will register FCM token...');
          const token = await getFCMToken();
          const action = setFCMRegistrationTokenForSession({
            sessionId,
            registrationToken: token,
          });
          await dispatch(action).unwrap();
        } catch (error) {
          console.warn($FUNC, 'Failed to register FCM token:', error);
        }
      })();
  }, [dispatch, didRegisterFCMToken, sessionId]);

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
