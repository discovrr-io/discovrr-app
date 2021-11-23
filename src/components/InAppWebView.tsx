import * as React from 'react';
import { SafeAreaView, useWindowDimensions } from 'react-native';

import WebView, { WebViewProps } from 'react-native-webview';
import { useNavigation } from '@react-navigation/core';

import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import * as constants from 'src/constants';

export default function InAppWebView(props: WebViewProps) {
  const { width: windowWidth } = useWindowDimensions();
  const navigation = useNavigation();
  const webviewRef = React.useRef<WebView>(null);

  const [canGoBack, setCanGoBack] = React.useState(false);
  const [title, setTitle] = React.useState<string>();

  React.useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', e => {
      if (!canGoBack) return;
      e.preventDefault();
      webviewRef.current?.goBack();
    });

    return unsubscribe;
  }, [navigation, canGoBack]);

  React.useLayoutEffect(() => {
    if (title) navigation.setOptions({ title });
  }, [navigation, title]);

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
        [constants.color.blue500, constants.color.teal300],
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
        ref={webviewRef}
        onLoadStart={event => {
          loading.value = true;
          props.onLoadStart?.(event);
          setCanGoBack(event.nativeEvent.canGoBack);
          setTitle(event.nativeEvent.title);
        }}
        onLoadEnd={event => {
          loading.value = false;
          props.onLoadEnd?.(event);
          setCanGoBack(event.nativeEvent.canGoBack);
          setTitle(event.nativeEvent.title);
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
