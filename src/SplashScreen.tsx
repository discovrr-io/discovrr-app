import React from 'react';
import { ActivityIndicator, SafeAreaView } from 'react-native';

import FastImage from 'react-native-fast-image';
import { Spacer } from './components';
import { color } from './constants';

const LOGO = require('../assets/bootsplash_logo.png');
const LOGO_WIDTH = 120;

export default function SplashScreen() {
  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
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