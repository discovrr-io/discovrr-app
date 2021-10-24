import React, { useEffect, useRef } from 'react';

import analytics from '@react-native-firebase/analytics';
import inAppMessaging from '@react-native-firebase/in-app-messaging';

import AsyncStorage from '@react-native-async-storage/async-storage';
import codePush, { CodePushOptions } from 'react-native-code-push';
import Config from 'react-native-config';
import Parse from 'parse/react-native';
import RNBootSplash from 'react-native-bootsplash';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { PortalProvider } from '@gorhom/portal';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import {
  DefaultTheme,
  NavigationContainer,
  NavigationContainerRef,
  Theme,
} from '@react-navigation/native';
import { useFlipper } from '@react-navigation/devtools';

import store from './store';
import SplashScreen from './SplashScreen';
import { color } from './constants';
import { useAppDispatch } from './hooks';
import { resetAppState } from './global-actions';

import AuthGate from './features/authentication/AuthGate';
import { signOut } from './features/authentication/auth-slice';

Parse.setAsyncStorage(AsyncStorage);
Parse.User.enableUnsafeCurrentUser();

Parse.initialize(Config.PARSE_APP_ID || 'discovrr-dev-server');
Parse.serverURL = Config.PARSE_SERVER_URL || 'http://localhost:1337/parse';

// Store version 3.0.0.2 (3000002)
const STORE_VERSION = [3, 0, 0, 3] as const;
// Set this to the appropriate option any time the `STORE_VERSION` is changed
const SIGN_OUT_USER = true;

const persistor = persistStore(store);

const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: color.accent,
    background: color.white,
    card: color.white,
  },
};

function createVersionString(
  version: readonly [number, number, number, number],
): string {
  const [major, minor, patch, build] = version;
  return String(
    major * 10 ** 6 +
      (minor % 100) * 10 ** 4 +
      (patch % 100) * 10 ** 2 +
      (build % 100),
  );
}

function App() {
  const $FUNC = '[App]';
  useEffect(() => {
    console.log($FUNC, 'Suppressing in app messages...');
    inAppMessaging()
      .setMessagesDisplaySuppressed(true)
      .catch(error => {
        console.error($FUNC, 'Failed to suppress in app messages:', error);
      });
  }, []);

  return (
    <SafeAreaProvider>
      <PortalProvider>
        <Provider store={store}>
          <PersistedApp />
        </Provider>
      </PortalProvider>
    </SafeAreaProvider>
  );
}

function PersistedApp() {
  const $FUNC = '[PersistedApp]';
  const dispatch = useAppDispatch();

  const routeNameRef = useRef<string>();
  const navigationRef = useRef<NavigationContainerRef<any>>(null);

  useFlipper(navigationRef);

  useEffect(() => {
    RNBootSplash.hide({ fade: true }).catch(error => {
      console.error($FUNC, 'Failed to hide boot splash screen:', error);
    });
  }, []);

  const handleBeforeLift = async () => {
    try {
      const currVersion = createVersionString(STORE_VERSION);
      console.log($FUNC, 'Current store version:', currVersion);

      const [[_, prevVersion]] = await AsyncStorage.multiGet(['storeVersion']);
      console.log($FUNC, 'Previous store version:', prevVersion);

      if (prevVersion !== currVersion) {
        AsyncStorage.setItem('storeVersion', currVersion);
        console.log($FUNC, 'Purging store...');
        persistor.pause();

        // Custom purging - purges everything in the store except authentication
        const resetAction = resetAppState({
          // Only reset the FCM registration token if we actually signed the
          // user out (and thus their associated Parse.Session object has been
          // deleted)
          shouldResetFCMRegistrationToken: SIGN_OUT_USER,
        });

        // FIXME: Even if we don't sign out the user, the profile associated
        // with it will be purged
        dispatch(resetAction);

        // NOTE: User will only be signed out if the version has changed.
        // Subsequent app launches will not be affected.
        if (SIGN_OUT_USER) await dispatch(signOut()).unwrap();
      }
    } catch (error) {
      console.error($FUNC, 'Failed to configure persistor', error);
    }
  };

  const handleNavigationReady = () => {
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
  };

  const handleNavigationStateChange = async () => {
    const $FUNC = '[Navigation]';
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;

    if (previousRouteName !== currentRouteName) {
      if (__DEV__)
        console.log($FUNC, 'Sending screen analytics:', currentRouteName);
      await analytics().logScreenView({
        screen_name: currentRouteName,
        screen_class: currentRouteName,
      });
    }

    routeNameRef.current = currentRouteName;
  };

  return (
    <PersistGate
      persistor={persistor}
      loading={<SplashScreen />}
      onBeforeLift={handleBeforeLift}>
      <NavigationContainer
        ref={navigationRef}
        onReady={handleNavigationReady}
        onStateChange={handleNavigationStateChange}
        theme={navigationTheme}
        linking={{
          prefixes: [
            'discovrr://',
            'http://discovrrio.com',
            'https://discovrrio.com',
          ],
          config: {
            initialRouteName: 'Main',
            screens: {
              Main: '',
              PostDetails: 'post/:postId',
              ProfileDetails: 'profile/:profileId',
              ProductDetails: 'product/:productId',
              MainSettings: 'settings',
              ProfileSettings: 'settings/profile',
              LocationAccuracySettings: 'settings/location',
              NotificationSettings: 'settings/notifications',
              RouteError: '*',
            },
          },
        }}>
        <AuthGate />
      </NavigationContainer>
    </PersistGate>
  );
}

const codePushOptions: CodePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESTART,
};

export default codePush(codePushOptions)(App);
