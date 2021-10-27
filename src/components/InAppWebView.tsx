import * as React from 'react';
import { SafeAreaView, useWindowDimensions } from 'react-native';

import WebView from 'react-native-webview';
import { WebViewSource } from 'react-native-webview/lib/WebViewTypes';
import { StackNavigationOptions } from '@react-navigation/stack';

import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { color } from 'src/constants';
import { RootStackScreenProps } from 'src/navigation';

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
  const { width: windowWidth } = useWindowDimensions();

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
        resolvedDestination = 'https://api.discovrrio.com/terms';
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

  const loading = useSharedValue(true);
  const progress = useSharedValue(0);
  const progressColor = useSharedValue(0);

  const progressWidth = useDerivedValue(() =>
    withTiming(interpolate(progress.value, [0, 1], [0, windowWidth])),
  );

  const progressOpacity = useDerivedValue(() =>
    loading.value ? withTiming(1) : withTiming(0),
  );

  React.useEffect(() => {
    progressColor.value = withRepeat(
      withTiming(1, { duration: 500 }),
      -1, // Repeat indefinitely
      true, // Reverse animation on repeat
    );
  }, [progressColor]);

  const progressIndicatorStyle = useAnimatedStyle(() => {
    return {
      width: progressWidth.value,
      opacity: progressOpacity.value,
      backgroundColor: interpolateColor(
        progressColor.value,
        [0, 1],
        [color.blue500, color.teal300],
      ),
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {loading.value && (
        <Animated.View
          style={[
            progressIndicatorStyle,
            { position: 'absolute', height: 5, zIndex: 10 },
          ]}
        />
      )}
      <WebView
        allowFileAccess
        source={source}
        onLoadStart={() => (loading.value = true)}
        onLoadEnd={() => (loading.value = false)}
        onLoadProgress={({ nativeEvent }) =>
          (progress.value = nativeEvent.progress)
        }
        style={{ width: '100%' }}
      />
    </SafeAreaView>
  );
}
