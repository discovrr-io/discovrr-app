// This MUST be at the very top.
import 'react-native-gesture-handler';

import { AppRegistry, Text, TextInput } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';

import messaging from '@react-native-firebase/messaging';

Text.defaultProps = Text.defaultProps || {};
Text.defaultProps.maxFontSizeMultiplier = 1.5;

TextInput.defaultProps = TextInput.defaultProps || {};
TextInput.defaultProps.maxFontSizeMultiplier = 1.5;

messaging().setBackgroundMessageHandler(async remoteMessage => {
  // TODO: Do something with this message (maybe store in AsyncStorage?)
  console.log('Message handled in the background:', remoteMessage);
});

AppRegistry.registerComponent(appName, () => App);
