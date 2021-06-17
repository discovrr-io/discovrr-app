import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';

import Bugsnag from '@bugsnag/react-native';
import codePush from 'react-native-code-push';

import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import AsyncStorage from '@react-native-community/async-storage';
import { PersistGate } from 'redux-persist/integration/react';
import { persistReducer, persistStore } from 'redux-persist';

import { Provider } from 'react-redux';
import { createStore } from 'redux';

import { rootReducer } from './utilities/Reducers';
import AuthLoadingScreen from './screens/auth/AuthLoadingScreen';
import debugAppLogger from './utilities/DebugAppLogger';

Bugsnag.start();

global.debugAppLogger = () => {};
const disableDebugAppLogger = false;

if (process.env.NODE_ENV === 'development') {
  if (!disableDebugAppLogger) global.debugAppLogger = debugAppLogger;
}

const persistedReducer = persistReducer(
  {
    storage: AsyncStorage,
    key: 'root',
    stateReconciler: autoMergeLevel2,
    blacklist: ['appContext', 'networkState'],
  },
  rootReducer,
);

export const store = createStore(persistedReducer);
const persistor = persistStore(store);

const theme = {
  ...DefaultTheme,
};

export function App() {
  const onBeforeLift = async () => {
    const storeVersion = '3';
    try {
      const [[_, previousStoreVersion]] = await AsyncStorage.multiGet([
        'storeVersion',
      ]);

      console.log('[App.onBeforeLift] [storeVersion, previousStoreVersion]:', [
        previousStoreVersion,
        storeVersion,
      ]);

      if (previousStoreVersion !== storeVersion) {
        AsyncStorage.setItem('storeVersion', storeVersion);
        persistor.purge();
      }
    } catch (error) {
      console.error([
        '[App.onBeforeLift] Failed to configure persistor:',
        error,
      ]);
      AsyncStorage.setItem('storeVersion', storeVersion);
      persistor.purge().catch(() => {});
    }
  };

  const linking = {
    prefixes: [
      'https://discovrrio.com',
      'http://discovrrio.com',
      'discovrr://',
    ],
    config: {
      screens: {
        PostDetailScreen: 'post/:id',
        UserProfileScreen: 'profile/:id',
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
