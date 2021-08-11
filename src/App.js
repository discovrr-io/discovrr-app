import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';

import analytics from '@react-native-firebase/analytics';
import inAppMessaging from '@react-native-firebase/in-app-messaging';
import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import codePush from 'react-native-code-push';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import AuthLoadingScreen from './features/authentication/AuthLoadingScreen';
import store from './store';

const Parse = require('parse/react-native');

Parse.setAsyncStorage(AsyncStorage);
Parse.User.enableUnsafeCurrentUser();

// TODO: Use dotenv to hide production keys
if (__DEV__ && false) {
  Parse.initialize('discovrr-dev-server');
  Parse.serverURL = 'http://192.168.0.4:1337/parse';
} else {
  Parse.initialize('discovrrServer');
  Parse.serverURL = 'https://discovrr-uat.herokuapp.com/discovrrServer'; // production
}

global.debugAppLogger = () => {};
const disableDebugAppLogger = false;

if (process.env.NODE_ENV === 'development') {
  if (!disableDebugAppLogger) global.debugAppLogger = debugAppLogger;
}

const persistor = persistStore(store);

function LoadingScreen() {
  return (
    <View
      style={{
        flexGrow: 1,
        alignContent: 'center',
        justifyContent: 'center',
      }}>
      <ActivityIndicator size="large" color="gray" />
      <Text style={{ textAlign: 'center', marginTop: 8 }}>Loading...</Text>
    </View>
  );
}

/** @type {import('@react-navigation/native').LinkingOptions} */
const linking = {
  prefixes: ['discovrr://', 'http://discovrrio.com', 'https://discovrrio.com'],
  config: {
    screens: {
      GroundZero: {
        initialRouteName: 'HomeTabs',
        screens: {
          HomeTabs: {
            initialRouteName: 'Home',
            screens: {
              Home: '',
            },
          },
          PostDetailScreen: 'post/:postId',
          UserProfileScreen: 'profile/:profileId',
          MerchantProfileScreen: 'merchant/:merchantId',
          ProductCheckoutScreen: 'product/:productId',
        },
      },
    },
  },
};

export function App() {
  const $FUNC = '[App]';

  /**
   * @typedef {import('@react-navigation/native').NavigationContainerRef} NavigationContainerRef
   * @type {React.MutableRefObject<NavigationContainerRef>}
   */
  const navigationRef = useRef(null);
  /** @type {React.MutableRefObject<string>} */
  const routeNameRef = useRef(null);

  useEffect(() => {
    (async () => {
      // try {
      //   const apnsToken = await messaging().getAPNSToken();
      //   const token = await messaging().getToken();
      //   console.log({ apnsToken, token });
      // } catch (error) {
      //   console.error($FUNC, 'Some error:', error);
      // }

      messaging().onMessage(async (message) => {
        console.log($FUNC, 'New message:', message);
      });
    })();

    // TODO: Should we move this to LoginScreen?
    console.log($FUNC, 'Suppressing in app messages...');
    inAppMessaging()
      .setMessagesDisplaySuppressed(true)
      .catch((error) =>
        console.error($FUNC, 'Failed to suppress in app messages:', error),
      );

    // We could GET /health to force the server to wake up if it's sleeping.
    // It'll buy us some time to start up the server while the user reads the
    // screen and attempts to register or sign in.
    console.log($FUNC, 'Fetching health...');
    fetch(Parse.serverURL + '/health')
      .then((response) => response.json())
      .then((json) => {
        if (json.status !== 'ok') {
          console.warn(
            $FUNC,
            'Server did not return an ok status. Will continue on anyway.',
          );
        }
      })
      .catch((error) =>
        console.error($FUNC, 'Failed to get server status:', error),
      );
  }, []);

  const onBeforeLift = async () => {
    const $FUNC = '[App.onBeforeLift]';
    // TODO: Maybe check with Regex? (/^\d+\.\d{1,2}\.\d{1,2}$/g)
    const [major, minor, patch, build] = [2, 1, 2, 7];
    const versionNumber =
      major * 10 ** 6 + minor * 10 ** 4 + patch * 10 ** 2 + build;
    const currStoreVersion = String(versionNumber);
    console.log($FUNC, 'current store version:', currStoreVersion);

    try {
      const [[_, prevStoreVersion]] = await AsyncStorage.multiGet([
        'storeVersion',
      ]);

      console.log($FUNC, 'previous store version:', prevStoreVersion);

      if (prevStoreVersion !== currStoreVersion) {
        AsyncStorage.setItem('storeVersion', currStoreVersion);
        console.log($FUNC, 'Purging store...');
        persistor.pause();
        await persistor.flush();
        await persistor.purge();
      }
    } catch (error) {
      console.error($FUNC, 'Failed to configure persistor:', error);
    }
  };

  const handleNavigationOnReady = () => {
    routeNameRef.current = navigationRef.current.getCurrentRoute().name;
  };

  const handleNavigationOnStageChange = async (_state) => {
    const $FUNC = '[App.handleNavigationOnStageChange]';
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current.getCurrentRoute().name;
    if (previousRouteName !== currentRouteName) {
      if (__DEV__)
        console.log($FUNC, 'Sending screen analytics:', currentRouteName);
      await analytics().logScreenView({
        screen_name: currentRouteName,
        screen_class: currentRouteName,
      });
    }

    // Save the current route name for later comparison
    routeNameRef.current = currentRouteName;
  };
  return (
    <Provider store={store}>
      <PersistGate
        loading={<LoadingScreen />}
        persistor={persistor}
        onBeforeLift={onBeforeLift}>
        <BottomSheetModalProvider>
          <NavigationContainer
            ref={navigationRef}
            linking={linking}
            onReady={handleNavigationOnReady}
            onStateChange={handleNavigationOnStageChange}>
            <AuthLoadingScreen />
          </NavigationContainer>
        </BottomSheetModalProvider>
      </PersistGate>
    </Provider>
  );
}

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESUME,
};

export default codePush(codePushOptions)(App);
