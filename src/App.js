import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';

import AsyncStorage from '@react-native-community/async-storage';
import Bugsnag from '@bugsnag/react-native';
import codePush from 'react-native-code-push';

import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';

import AuthLoadingScreen from './features/authentication/AuthLoadingScreen';
import debugAppLogger from './utilities/DebugAppLogger';
import store from './store';
import { createStackNavigator } from '@react-navigation/stack';

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

const Stack = createStackNavigator();

export function App() {
  const onBeforeLift = async () => {
    const storeVersion = '5';
    try {
      const [[_, previousStoreVersion]] = await AsyncStorage.multiGet([
        'storeVersion',
      ]);

      console.log(
        '[App.onBeforeLift] previousStoreVersion:',
        previousStoreVersion,
      );

      if (previousStoreVersion !== storeVersion) {
        AsyncStorage.setItem('storeVersion', storeVersion);
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
        loading={null}
        persistor={persistor}
        onBeforeLift={onBeforeLift}>
        <PaperProvider theme={theme}>
          <NavigationContainer linking={linking}>
            <AuthLoadingScreen />
          </NavigationContainer>
        </PaperProvider>
      </PersistGate>
    </Provider>
  );
}

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  // installMode: codePush.InstallMode.ON_NEXT_RESUME,
  installMode: codePush.InstallMode.IMMEDIATE,
  // installMode: CodePush.InstallMode.ON_NEXT_SUSPEND,
};

export default codePush(codePushOptions)(App);
