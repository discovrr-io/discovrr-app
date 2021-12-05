import * as React from 'react';
import { Linking, Platform, StatusBar, useColorScheme } from 'react-native';

import analytics from '@react-native-firebase/analytics';
import inAppMessaging from '@react-native-firebase/in-app-messaging';
import messaging from '@react-native-firebase/messaging';

import AsyncStorage from '@react-native-async-storage/async-storage';
import codePush, { CodePushOptions } from 'react-native-code-push';
import Config from 'react-native-config';
import Parse from 'parse/react-native';
import RNBootSplash from 'react-native-bootsplash';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';
import { PortalProvider } from '@gorhom/portal';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// import { useFlipper } from '@react-navigation/devtools';
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
  NavigationContainerRef,
  Theme,
} from '@react-navigation/native';

import * as constants from './constants';
import store from './store';
import SplashScreen from './SplashScreen';
import { RootStackParamList } from './navigation';
import { useAppDispatch, useAppSelector } from './hooks';
import { resetAppState } from './global-actions';

import AuthGate from './features/authentication/AuthGate';
import { signOut } from './features/authentication/auth-slice';

// Redeclare forwardRef to allow generics
declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/ban-types
  function forwardRef<T, P = {}>(
    render: (props: P, ref: React.Ref<T>) => React.ReactElement | null,
  ): (props: P & React.RefAttributes<T>) => React.ReactElement | null;
}

GoogleSignin.configure();

Parse.setAsyncStorage(AsyncStorage);
Parse.User.enableUnsafeCurrentUser();

Parse.initialize(Config.PARSE_APP_ID || 'local-discovrr-dev-server');
Parse.serverURL = Config.PARSE_SERVER_URL || 'http://localhost:1337/parse';

const debugTheme: Theme = {
  ...DefaultTheme,
  colors: {
    primary: 'orange',
    background: 'paleturquoise',
    card: 'lightcyan',
    text: 'purple',
    border: 'red',
    notification: 'yellow',
  },
};

const lightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: constants.color.accent,
    border: constants.color.gray200,
    background: constants.color.white,
    card: constants.color.absoluteWhite,
    notification: constants.color.red500,
  },
};

const darkTheme: Theme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: constants.color.accent,
    border: constants.color.gray800,
    background: constants.color.absoluteBlack,
    card: constants.color.gray900,
    notification: constants.color.red500,
  },
};

const persistor = persistStore(store);

function App() {
  const $FUNC = '[App]';

  React.useEffect(() => {
    console.log($FUNC, 'Suppressing in app messages...');
    inAppMessaging()
      .setMessagesDisplaySuppressed(true)
      .catch(error => {
        console.error($FUNC, 'Failed to suppress in app messages:', error);
      });
  }, []);

  return (
    <SafeAreaProvider>
      <ReduxProvider store={store}>
        <PersistedApp />
      </ReduxProvider>
    </SafeAreaProvider>
  );
}

function PersistedApp() {
  const $FUNC = '[PersistedApp]';
  const dispatch = useAppDispatch();

  const authStatus = useAppSelector(state => state.auth.status);

  const systemScheme = useColorScheme();
  const selectedAppearance = useAppSelector(
    state => state.settings.appearancePrefs,
  );

  const navigationTheme = React.useMemo(() => {
    switch (selectedAppearance) {
      case 'light':
        return lightTheme;
      case 'dark':
        return darkTheme;
      case 'debug':
        return debugTheme;
      case 'system': /* FALLTHROUGH */
      default:
        return systemScheme === 'dark' ? darkTheme : lightTheme;
    }
  }, [systemScheme, selectedAppearance]);

  React.useEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
    }
    StatusBar.setBarStyle(
      navigationTheme.dark ? 'light-content' : 'dark-content',
      true,
    );
  }, [navigationTheme]);

  const routeNameRef = React.useRef<string>();
  const navigationRef =
    React.useRef<NavigationContainerRef<RootStackParamList>>(null);

  // useFlipper(navigationRef);

  const handleBeforeLift = async () => {
    try {
      const currVersion = constants.values.STORE_VERSION;
      console.log($FUNC, 'Current store version:', currVersion);

      const [[_, prevVersion]] = await AsyncStorage.multiGet(['storeVersion']);
      console.log($FUNC, 'Previous store version:', prevVersion);

      // We don't want to purge the store if the user has started the app for
      // the first time
      if (!prevVersion) {
        console.warn($FUNC, 'Store version not found. Skipping...');
        await AsyncStorage.setItem('storeVersion', currVersion);
        return;
      }

      if (prevVersion !== currVersion) {
        await AsyncStorage.setItem('storeVersion', currVersion);
        console.log($FUNC, 'Purging store...');
        persistor.pause();

        // Custom purging - purges everything in the store except authentication
        // FIXME: This is not asynchronous, so we'll need to wait for every
        // single part of the store to be cleared, one after the other.
        const resetAppStateAction = resetAppState({
          // Only reset the FCM registration token if we actually signed the
          // user out (and thus their associated Parse.Session object has been
          // deleted)
          shouldResetFCMRegistrationToken:
            constants.values.STORE_SHOULD_SIGN_OUT,
        });

        // FIXME: Even if we don't sign out the user, the profile associated
        // with it will be purged
        dispatch(resetAppStateAction);

        // NOTE: User will only be signed out if the version has changed.
        // Subsequent app launches will not be affected.
        if (constants.values.STORE_SHOULD_SIGN_OUT) {
          await dispatch(signOut()).unwrap();
        }
      }
    } catch (error) {
      console.error($FUNC, 'Failed to configure persistor', error);
    }
  };

  const handleNavigationReady = () => {
    routeNameRef.current = navigationRef.current?.getCurrentRoute()?.name;
    RNBootSplash.hide({ fade: true }).catch(error => {
      console.error($FUNC, 'Failed to hide boot splash screen:', error);
    });
  };

  const handleNavigationStateChange = async () => {
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
      loading={<SplashScreen navigationTheme={navigationTheme} />}
      onBeforeLift={handleBeforeLift}>
      <NavigationContainer<RootStackParamList>
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
              ProfileDetails: 'profile/:profileIdOrUsername',
              ProductDetails: 'product/:productId',
              MainSettings: 'settings',
              ProfileSettings: 'settings/profile',
              NotificationSettings: 'settings/notifications',
              AppearanceSettings: 'settings/appearance',
              RouteError: '*',
            },
          },
          getInitialURL: async () => {
            // Check if app was opened from a deep link, and return it.
            const url = await Linking.getInitialURL();
            if (url != null) return url;

            // Only pass the initial URL if the current user is authenticated
            // TODO: Remove this now that authentication is optional
            if (authStatus !== 'fulfilled') {
              // console.warn(
              //   $FUNC,
              //   'User is not signed in. Skipping initial URL...',
              // );
              return;
            }

            // Otherwise, check if there is an initial Firebase notification.
            const message = await messaging().getInitialNotification();

            // Get the deep link from notification's data.
            // If the return value is undefined, the app will open the first
            // screen as normal.
            if (message?.data?.link) {
              // This requires the "discovrr" scheme prepended to work.
              return 'discovrr://' + message?.data?.link;
            }
          },
          subscribe: listener => {
            const onReceiveURL = ({ url }: { url: string }) => {
              // This requires the "discovrr" scheme prepended to work.
              listener('discovrr://' + url);
            };

            // Listen to incoming links from deep linking
            const urlListener = Linking.addEventListener('url', onReceiveURL);

            // Listen to Firebase push notifications
            const unsubscribe = messaging().onNotificationOpenedApp(message => {
              const url = message?.data?.link;
              if (url) {
                // This requires the "discovrr" scheme prepended to work.
                listener('discovrr://' + url);
              }
            });

            return () => {
              urlListener.remove();
              unsubscribe();
            };
          },
        }}>
        <PortalProvider>
          <AuthGate />
        </PortalProvider>
      </NavigationContainer>
    </PersistGate>
  );
}

const codePushOptions: CodePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_SUSPEND,
  minimumBackgroundDuration: 600, // 600 seconds === 10 minutes
};

export default codePush(codePushOptions)(App);
