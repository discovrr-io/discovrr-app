import * as React from 'react';
import { SafeAreaView, useWindowDimensions } from 'react-native';

import WebView, { WebViewProps } from 'react-native-webview';

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

export default function InAppWebView(props: WebViewProps) {
  const { width: windowWidth } = useWindowDimensions();

  const loading = useSharedValue(true);
  const progress = useSharedValue(0);
  const progressColor = useSharedValue(0);

  const progressWidth = useDerivedValue(() => {
    return withTiming(interpolate(progress.value, [0, 1], [0, windowWidth]));
  });

  const progressOpacity = useDerivedValue(() => {
    return withTiming(loading.value ? 1 : 0);
  });

  React.useEffect(
    () => {
      progressColor.value = withRepeat(
        withTiming(1, { duration: 500 }),
        -1, // Repeat indefinitely
        true, // Reverse animation on repeat
      );
    },
    // NOTE: We just want to fire this effect once, so we won't include a
    // dependency to `progressColor`. It probably doesn't even matter anyway.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

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
        {...props}
        onLoadStart={event => {
          loading.value = true;
          props.onLoadStart?.(event);
        }}
        onLoadEnd={event => {
          loading.value = false;
          props.onLoadEnd?.(event);
        }}
        onLoadProgress={event => {
          progress.value = event.nativeEvent.progress;
          props.onLoadProgress?.(event);
        }}
        style={[{ width: windowWidth }, props.style]}
      />
    </SafeAreaView>
  );
}
