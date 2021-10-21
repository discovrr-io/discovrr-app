// @ts-ignore
import { PARSE_SERVER_TERMS_URL } from '@env';

import React, { useEffect, useRef, useState } from 'react';
import { Animated, SafeAreaView, useWindowDimensions } from 'react-native';

import WebView from 'react-native-webview';
import { WebViewSource } from 'react-native-webview/lib/WebViewTypes';
import { StackNavigationOptions } from '@react-navigation/stack';

import { RootStackScreenProps } from 'src/navigation';
import { color } from 'src/constants';

type InAppWebViewDestination =
  | 'about-discovrr'
  | 'privacy-policy'
  | 'terms-and-conditions'
  | { uri: string };

export type InAppWebViewNavigationScreenParams = {
  title: string;
  destination: InAppWebViewDestination;
  presentation?: StackNavigationOptions['presentation'];
};

type InAppWebViewProps = RootStackScreenProps<'InAppWebView'>;

export default function InAppWebView(props: InAppWebViewProps) {
  const { destination } = props.route.params;
  const { width: screenWidth } = useWindowDimensions();

  let source: WebViewSource;
  if (typeof destination === 'string') {
    let resolvedDestination: string;

    switch (destination) {
      case 'about-discovrr':
        resolvedDestination = 'https://discovrr.com.au/about';
        break;
      case 'privacy-policy':
        resolvedDestination = 'https://discovrr.com.au/privacy';
        break;
      case 'terms-and-conditions':
        resolvedDestination =
          PARSE_SERVER_TERMS_URL || 'https://api.discovrr.com/terms';
        break;
      default:
        console.warn('Received invalid destination:', destination);
        resolvedDestination = '';
        break;
    }

    source = { uri: resolvedDestination };
  } else {
    source = destination;
  }

  const fadeAnimation = useRef(new Animated.Value(1)).current;
  const colorAnimation = useRef(new Animated.Value(0)).current;
  const progressAnimation = useRef(new Animated.Value(0)).current;

  const [isLoading, setIsLoading] = useState(true);

  useEffect(
    () => {
      if (isLoading)
        Animated.loop(
          Animated.sequence([
            Animated.timing(colorAnimation, {
              toValue: 1,
              duration: 800,
              useNativeDriver: false,
            }),
            Animated.timing(colorAnimation, {
              toValue: 0,
              duration: 800,
              useNativeDriver: false,
            }),
          ]),
        ).start();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isLoading],
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        allowFileAccess
        source={source}
        onLoadStart={() => {
          setIsLoading(true);
          Animated.timing(fadeAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }).start();
        }}
        onLoadProgress={({ nativeEvent }) => {
          progressAnimation.setValue(nativeEvent.progress);
        }}
        onLoadEnd={() => {
          Animated.timing(fadeAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }).start(() => setIsLoading(false));
        }}
        style={{ width: '100%' }}
      />
      {isLoading && (
        <Animated.View
          style={{
            position: 'absolute',
            height: 5,
            opacity: fadeAnimation,
            width: progressAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, screenWidth],
            }),
            backgroundColor: colorAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [color.blue500, color.teal500],
            }),
          }}
        />
      )}
    </SafeAreaView>
  );
}
