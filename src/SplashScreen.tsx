import * as React from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';

import analytics from '@react-native-firebase/analytics';
import FastImage from 'react-native-fast-image';
import { Spacer } from './components';
import { color } from './constants';

const LOGO = require('../assets/bootsplash_logo.png');
const LOGO_WIDTH = 120;

export default function SplashScreen() {
  React.useEffect(() => {
    analytics()
      .logScreenView({
        screen_name: 'SplashScreen',
        screen_class: 'SplashScreen',
      })
      .catch(error => {
        console.warn('[SplashScreen] Failed to log screen view:', error);
      });
  });

  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <StatusBar
        animated
        translucent
        barStyle="dark-content"
        backgroundColor="transparent"
      />
      <FastImage
        source={LOGO}
        style={{ width: LOGO_WIDTH, height: LOGO_WIDTH }}
      />
      <Spacer.Vertical value="lg" />
      <ActivityIndicator
        size="large"
        color={color.gray500}
        style={{ transform: [{ scale: 0.75 }] }}
      />
    </SafeAreaView>
  );
}
