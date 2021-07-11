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
      <Text style={{ textAlign: 'center' }}>Loading...</Text>
    </View>
  );
}

/** @type {import('@react-navigation/native').LinkingOptions} */
const linking = {
  prefixes: ['https://discovrrio.com', 'http://discovrrio.com', 'discovrr://'],
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

  const onBeforeLift = async () => {
    // TODO: Maybe check with Regex? (/^\d+\.\d{1,2}\.\d{1,2}$/g)
    const [major, minor, patch, build] = [2, 1, 2, 6];
    const versionNumber =
      major * 10 ** 6 + minor * 10 ** 4 + patch * 10 ** 2 + build;
    const currStoreVersion = String(versionNumber);
    console.log('[App.onBeforeLift] current store version:', currStoreVersion);

    try {
      const [[_, prevStoreVersion]] = await AsyncStorage.multiGet([
        'storeVersion',
      ]);

      console.log(
        '[App.onBeforeLift] previous store version:',
        prevStoreVersion,
      );

      if (prevStoreVersion !== currStoreVersion) {
        AsyncStorage.setItem('storeVersion', currStoreVersion);
        console.log('[App.onBeforeLift] Purging store...');
        await persistor.purge();
      }
    } catch (error) {
      console.error([
        '[App.onBeforeLift] Failed to configure persistor:',
        error,
      ]);
    }
  };

  const handleNavigationOnReady = () => {
    routeNameRef.current = navigationRef.current.getCurrentRoute().name;
  };

  const handleNavigationOnStageChange = async (state) => {
    const previousRouteName = routeNameRef.current;
    const currentRouteName = navigationRef.current.getCurrentRoute().name;
    if (previousRouteName !== currentRouteName) {
      if (__DEV__) console.log('Sending screen analytics:', currentRouteName);
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
        loading={__DEV__ ? <LoadingScreen /> : null}
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
