import * as React from 'react';
import { ActivityIndicator, SafeAreaView, StatusBar } from 'react-native';

import analytics from '@react-native-firebase/analytics';
import FastImage from 'react-native-fast-image';
import { Theme } from '@react-navigation/native';

import * as constants from './constants';
import { Spacer } from './components';

const LOGO = require('../assets/bootsplash_logo.png');
const LOGO_WIDTH = 120;

type SplashScreenProps = {
  navigationTheme: Theme;
};

export default function SplashScreen(props: SplashScreenProps) {
  const { colors, dark } = props.navigationTheme;

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
        backgroundColor: colors.card,
      }}>
      <StatusBar
        animated
        translucent
        barStyle={dark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
      />
      <FastImage
        source={LOGO}
        style={{ width: LOGO_WIDTH, height: LOGO_WIDTH }}
      />
      <Spacer.Vertical value="lg" />
      <ActivityIndicator
        size="large"
        color={constants.color.gray500}
        style={{ transform: [{ scale: 0.75 }] }}
      />
    </SafeAreaView>
  );
}
