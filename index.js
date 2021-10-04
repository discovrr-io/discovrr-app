// This MUST be at the very top.
import 'react-native-gesture-handler';

import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';
import App from './src/App';

AppRegistry.registerComponent(appName, () => App);
