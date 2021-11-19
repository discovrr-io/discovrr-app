// This MUST be at the very top.
import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';

import messaging from '@react-native-firebase/messaging';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  // TODO: Do something with this message (maybe store in AsyncStorage?)
  console.log('Message handled in the background:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
