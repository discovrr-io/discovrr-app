import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';

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

export function App() {
  const onBeforeLift = async () => {
    // TODO: Maybe check with Regex? (/^\d+\.\d{1,2}\.\d{1,2}$/g)
    const [major, minor, patch, build] = [2, 1, 2, 0];
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
        persistor.purge();
      }
    } catch (error) {
      console.error([
        '[App.onBeforeLift] Failed to configure persistor:',
        error,
      ]);
    }
  };

  /** @type {import('@react-navigation/native').LinkingOptions} */
  const linking = {
    prefixes: [
      'https://discovrrio.com',
      'http://discovrrio.com',
      'discovrr://',
    ],
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

  return (
    <Provider store={store}>
      <PersistGate
        loading={__DEV__ ? <Text>Loading...</Text> : null}
        persistor={persistor}
        onBeforeLift={onBeforeLift}>
        <PaperProvider theme={theme}>
          <BottomSheetModalProvider>
            <NavigationContainer linking={linking}>
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
