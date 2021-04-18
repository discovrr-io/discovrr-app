import React, {
  Component,
} from 'react';

import Bugsnag from '@bugsnag/react-native';
// import BugsnagPluginReactNavigation from '@bugsnag/plugin-react-navigation';
import codePush from 'react-native-code-push';
// import logger from 'redux-logger';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import AsyncStorage from '@react-native-community/async-storage';

import {
  PersistGate,
} from 'redux-persist/integration/react';

import {
  persistReducer,
  persistStore,
} from 'redux-persist';

import {
  Provider,
} from 'react-redux';

import {
  createStore,
  // applyMiddleware,
} from 'redux';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  DefaultTheme,
  Provider as PaperProvider,
} from 'react-native-paper';

import { rootReducer } from './src/utilities/Reducers';

import debugAppLogger from './src/utilities/DebugAppLogger';

import AuthLoadingScreen from './src/AuthLoadingScreen';
// import HomeScreen from './src/HomeScreen';
// import BoardsScreen from './src/BoardsScreen';

Bugsnag.start({
  // plugins: [new BugsnagPluginReactNavigation()],
});

// const { createNavigationContainer } = Bugsnag.getPlugin('reactNavigation');
// const BugsnagNavigationContainer = createNavigationContainer(NavigationContainer);

global.debugAppLogger = () => {};
const disableDebugAppLogger = false;

if (process.env.NODE_ENV === 'development') {
  // if (!disableDebugReduxLogger) middleware.push(createLogger());

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

export const store = createStore(
  persistedReducer,
  // applyMiddleware(logger),
);

const persistor = persistStore(store);

const theme = {
  ...DefaultTheme,
};

const linking = {
  prefixes: [
    /* your linking prefixes */
    'discovrr://',
    'https://discovrrio.com',
    'http://discovrrio.com',
  ],
  config: {
    /* configuration for matching screens with paths */
    screens: {
      PostDetailScreen: 'post/:id',
      UserProfileScreen: 'profile/:id',
    },
  },
};

class App extends Component {
  onBeforeLift = async () => {
    const storeVer = '3';
    await AsyncStorage.multiGet(['storeVersion'])
      .then(async ([[, previousStoreVersion]]) => {
        debugAppLogger({ info: 'onBeforeLift', storeVer, previousStoreVersion });
        if (previousStoreVersion !== storeVer) {
          AsyncStorage
            .setItem('storeVersion', storeVer)
            .catch(() => {});

          persistor
            .purge()
            .catch(() => {});
        }
      })
      .catch((error) => {
        debugAppLogger({ info: 'onBeforeLift', errorMessage: error.message });
        AsyncStorage
          .setItem('storeVersion', storeVer)
          .catch(() => {});

        persistor
          .purge()
          .catch(() => {});
      });

    // linkStore(store);
  }

  render() {
    return (
      <Provider store={store}>
        <PersistGate
          loading={null}
          persistor={persistor}
          onBeforeLift={this.onBeforeLift}
        >
          <PaperProvider theme={theme}>
            <NavigationContainer
              // linking={linking}
              // fallback={<Text>Food</Text>}
            >
              <AuthLoadingScreen />
            </NavigationContainer>
          </PaperProvider>
        </PersistGate>
      </Provider>
    );
  }
}

const codePushOptions = {
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  // installMode: codePush.InstallMode.ON_NEXT_RESUME,
  installMode: codePush.InstallMode.IMMEDIATE,
  // installMode: CodePush.InstallMode.ON_NEXT_SUSPEND,
};

export default codePush(codePushOptions)(App);
