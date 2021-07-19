import React, { useRef } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';

import analytics from '@react-native-firebase/analytics';
import AsyncStorage from '@react-native-community/async-storage';
import Bugsnag from '@bugsnag/react-native';
import codePush from 'react-native-code-push';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';

import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

import AuthLoadingScreen from './features/authentication/AuthLoadingScreen';
import debugAppLogger from './utilities/DebugAppLogger';
import store from './store';

const Parse = require('parse/react-native');

Parse.setAsyncStorage(AsyncStorage);
Parse.User.enableUnsafeCurrentUser();

// TODO: Use dotenv to hide production keys
if (__DEV__ && false) {
  Parse.initialize('discovrr-dev-server');
  // Parse.serverURL = 'http://discovrr-dev-server.herokuapp.com/parse';
  Parse.serverURL = 'http://192.168.0.4:1337/parse';
} else {
  Parse.initialize('discovrrServer');
  Parse.serverURL = 'https://discovrr-uat.herokuapp.com/discovrrServer'; // production
}

Bugsnag.start();

global.debugAppLogger = () => {};
const disableDebugAppLogger = false;

if (process.env.NODE_ENV === 'development') {
  if (!disableDebugAppLogger) global.debugAppLogger = debugAppLogger;
}

const theme = {
  ...DefaultTheme,
};

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
  prefixes: ['discovrr://', 'https://discovrrio.com', 'http://discovrrio.com'],
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
  /**
   * @typedef {import('@react-navigation/native').NavigationContainerRef} NavigationContainerRef
   * @type {React.MutableRefObject<NavigationContainerRef>}
   */
  const navigationRef = useRef(null);
  /** @type {React.MutableRefObject<string>} */
  const routeNameRef = useRef(null);

  // We could GET /health to force the server to wake up if it's sleeping. That
  // way it'll buy us some time while the user reads the screen and attempts to
  // register or sign in. This still needs some testing though.
  // useEffect(() => {
  //   console.log('Fetching health...');
  //   fetch('https://discovrr-uat.herokuapp.com/health')
  //     .then((response) => response.json())
  //     .then(console.log)
  //     .catch(console.error);
  // }, []);

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
      console.error([$FUNC, 'Failed to configure persistor:', error]);
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
        <PaperProvider theme={theme}>
          <BottomSheetModalProvider>
            <NavigationContainer
              ref={navigationRef}
              linking={linking}
              onReady={handleNavigationOnReady}
              onStateChange={handleNavigationOnStageChange}>
              <AuthLoadingScreen />
            </NavigationContainer>
          </BottomSheetModalProvider>
        </PaperProvider>
      </PersistGate>
    </Provider>
  );
}

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESUME,
};

export default codePush(codePushOptions)(App);
