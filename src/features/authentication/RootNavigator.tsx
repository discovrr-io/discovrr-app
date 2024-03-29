import * as React from 'react';
import { Platform } from 'react-native';

import codePush from 'react-native-code-push';
import messaging from '@react-native-firebase/messaging';
import { nanoid } from '@reduxjs/toolkit';

import {
  CardStyleInterpolators,
  HeaderStyleInterpolators,
} from '@react-navigation/stack';

import * as constants from 'src/constants';
import * as notificationsSlice from 'src/features/notifications/notifications-slice';
import { SessionApi } from 'src/api';
import { HeaderIcon, PlaceholderScreen, RouteError } from 'src/components';
import { useAppDispatch, useAppSelector, useExtendedTheme } from 'src/hooks';
import { NotificationId, SessionId } from 'src/models';
import { RootStack } from 'src/navigation';

import MainNavigator from './MainNavigator';
import AuthPromptNavigator from './AuthPromptNavigator';
import InAppWebViewScreen from './InAppWebViewScreen';
import OnboardingNavigator from 'src/features/onboarding/OnboardingNavigator';
import CreateItemNavigator from 'src/features/create/CreateItemNavigator';
import ReportItemNavigator from 'src/features/reporting/ReportItemNavigator';

import renderPostNavigator from 'src/features/posts/PostNavigator';
import renderProfileNavigator from 'src/features/profiles/ProfileNavigator';
import renderProductNavigator from 'src/features/products/ProductNavigator';
import renderSettingsNavigator from 'src/features/settings/SettingsNavigator';

export default function RootNavigator() {
  const $FUNC = '[RootNavigator]';
  const dispatch = useAppDispatch();
  const { colors } = useExtendedTheme();

  const sessionId = useAppSelector(state => state.auth.sessionId);
  const didRegisterFCMToken = useAppSelector(state => {
    return state.notifications.didRegisterFCMToken;
  });

  React.useEffect(() => {
    // Allow restarts from this point on. If there is an update available, it'll
    // restart the app, otherwise nothing will happen.
    console.log($FUNC, 'Allowing CodePush restarts');
    codePush.allowRestart();
  }, []);

  React.useEffect(() => {
    const unsubscribe = messaging().onMessage(remoteMessage => {
      console.log($FUNC, 'New message:', remoteMessage);

      const notificationTitle = remoteMessage.notification?.title;
      const notificationBody = remoteMessage.notification?.body;
      const notificationId =
        remoteMessage.data?.parseObjectId ||
        remoteMessage.messageId ||
        nanoid();

      if (!notificationTitle || !notificationBody) return;

      dispatch(
        notificationsSlice.didReceiveNotification({
          id: notificationId as NotificationId,
          title: notificationTitle,
          body: notificationBody,
          receivedAt: new Date().toISOString(),
          type: remoteMessage.data?.type,
          link: remoteMessage.data?.link,
          imageUrl:
            // @ts-ignore For some reason on iOS, the value type of the
            // `fcm_options` is not a string, but an record (at least in this
            // situation)
            remoteMessage.data?.fcm_options?.image ||
            remoteMessage.notification?.android?.imageUrl ||
            undefined, // Force empty strings to be undefined
          imageShape: remoteMessage.data?.imageShape,
        }),
      );
    });

    return unsubscribe;
  }, [dispatch]);

  // This'll run every time the user starts the app or right after a restart
  // issued by a CodePush update
  React.useEffect(() => {
    if (sessionId) {
      console.log($FUNC, `Setting app version for session '${sessionId}'...`);
      SessionApi.setAppVersionForSession({
        sessionId,
        appVersion: constants.values.APP_VERSION,
        storeVersion: constants.values.STORE_VERSION,
      }).catch(error => {
        console.warn($FUNC, 'Failed to set app version for session:', error);
      });
    }
  }, [sessionId]);

  React.useEffect(() => {
    async function getFCMToken(): Promise<string> {
      if (!messaging().isDeviceRegisteredForRemoteMessages) {
        // TODO: Does this throw an error if the user doesn't accept?
        console.log($FUNC, 'Registering device for remote messages...');
        await messaging().registerDeviceForRemoteMessages();
      }

      const token = await messaging().getToken();
      return token;
    }

    async function saveSessionFCMToken(sessionId: SessionId) {
      try {
        console.log($FUNC, 'Setting FCM registration token...');
        const token = await getFCMToken();
        const action = notificationsSlice.setFCMRegistrationTokenForSession({
          sessionId,
          registrationToken: token,
          // FIXME: This won't be updated if FCM token is already set (which
          // only happens if the user signs in)
          appVersion: constants.values.APP_VERSION,
          storeVersion: constants.values.STORE_VERSION,
        });
        await dispatch(action).unwrap();
      } catch (error) {
        console.warn($FUNC, 'Failed to register FCM token:', error);
      }
    }

    if (!didRegisterFCMToken && sessionId) saveSessionFCMToken(sessionId);
  }, [dispatch, didRegisterFCMToken, sessionId]);

  return (
    <RootStack.Navigator
      initialRouteName="Main"
      screenOptions={{
        headerBackTitleVisible: false,
        headerTintColor: colors.text,
        headerBackAllowFontScaling: false,
        headerTitleAllowFontScaling: false,
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
        headerLeft: props => <HeaderIcon.Back {...props} />,
        headerLeftContainerStyle: {
          paddingLeft: constants.layout.spacing.xs,
        },
        headerStyleInterpolator: Platform.select({
          ios: HeaderStyleInterpolators.forUIKit,
        }),
      }}>
      {/* -- Onboarding -- */}
      <RootStack.Group>
        <RootStack.Screen
          name="Onboarding"
          component={OnboardingNavigator}
          options={{
            headerShown: false,
            presentation: 'modal',
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
            gestureEnabled: false,
          }}
        />
      </RootStack.Group>

      {/* -- Authentication -- */}
      <RootStack.Group>
        <RootStack.Screen
          name="AuthPrompt"
          component={AuthPromptNavigator}
          options={{ headerShown: false, presentation: 'modal' }}
        />
      </RootStack.Group>

      {/* -- Top Level Screens -- */}
      <RootStack.Group screenOptions={{ headerShown: false }}>
        <RootStack.Screen
          name="Main"
          component={MainNavigator}
          options={{
            cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
          }}
        />
        <RootStack.Screen
          name="Create"
          component={CreateItemNavigator}
          options={{ presentation: 'modal' }}
        />
      </RootStack.Group>

      {/* -- Item Navigators -- */}
      {renderPostNavigator()}
      {renderProfileNavigator()}
      {renderProductNavigator()}

      {/* -- Drawer Screens -- */}
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
        name="ReportItem"
        component={ReportItemNavigator}
        options={{ headerShown: false, presentation: 'modal' }}
      />
      <RootStack.Screen
        name="InAppWebView"
        component={InAppWebViewScreen}
        options={({ route }) => {
          const { title, presentation } = route.params;
          return {
            title,
            presentation,
            headerLeft:
              presentation === 'modal' || presentation === 'transparentModal'
                ? HeaderIcon.Close
                : HeaderIcon.Back,
            headerTitleContainerStyle:
              constants.layout.narrowHeaderTitleContainerStyle,
          };
        }}
      />
      <RootStack.Screen
        name="RouteError"
        component={RouteError}
        options={{ title: 'Error' }}
      />
    </RootStack.Navigator>
  );
}
