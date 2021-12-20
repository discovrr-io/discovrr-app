import * as React from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import { BlurView } from '@react-native-community/blur';
import { Portal } from '@gorhom/portal';

import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

import Spacer from './Spacer';
import { Button } from './buttons';
import { color, font, layout } from 'src/constants';

const PROGRESS_BAR_HEIGHT = 5;

export type LoadingOverlayState = Pick<
  LoadingOverlayProps,
  'message' | 'caption'
> & {
  isUploading?: boolean;
  canCancel?: boolean;
};

export type LoadingOverlayProps = {
  message?: string;
  caption?: string;
  progress?: Animated.SharedValue<number>;
  onCancel?: () => void | Promise<void>;
  preferBlur?: boolean;
};

export default function LoadingOverlay(props: LoadingOverlayProps) {
  const {
    message,
    caption,
    progress,
    onCancel,
    preferBlur = Platform.OS === 'ios',
  } = props;

  React.useEffect(() => {
    Keyboard.dismiss();
  }, []);

  return (
    <Portal>
      {preferBlur && (
        <BlurView
          blurRadius={5}
          blurType="dark"
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        style={[
          styles.container,
          StyleSheet.absoluteFill,
          !preferBlur && { backgroundColor: 'rgba(0,0,0,0.75)' },
        ]}>
        <View style={styles.contentContainer}>
          <ActivityIndicator
            size="large"
            color={color.white}
            style={styles.activityIndicator}
          />
          <Text style={styles.message}>{message || 'Loading…'}</Text>
          <Text style={styles.caption}>
            {caption || "This won't take long"}
          </Text>
          {progress && <ProgressBar progress={progress} />}
          {onCancel && <CancelButton onCancel={onCancel} />}
        </View>
      </View>
    </Portal>
  );
}

function ProgressBar(props: { progress: Animated.SharedValue<number> }) {
  const { width: windowWidth } = useWindowDimensions();
  const progressBarWidth = windowWidth * 0.5;

  const progressBarStyle = useAnimatedStyle(() => ({
    width: withTiming(progressBarWidth * props.progress.value),
  }));

  return (
    <>
      <Spacer.Vertical value="lg" />
      <View
        style={[
          styles.progressBar,
          { width: progressBarWidth, backgroundColor: color.gray100 },
        ]}>
        <Animated.View
          style={[
            progressBarStyle,
            styles.progressBar,
            { backgroundColor: color.accent },
          ]}
        />
      </View>
    </>
  );
}

function CancelButton(props: { onCancel?: LoadingOverlayProps['onCancel'] }) {
  return (
    <>
      <Spacer.Vertical value="lg" />
      <Button
        title="Cancel"
        type="primary"
        variant="contained"
        size="small"
        onPress={props.onCancel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignContent: 'center',
    justifyContent: 'center',
    paddingVertical: layout.spacing.lg,
    paddingHorizontal: layout.spacing.xxl,
  },
  contentContainer: {
    alignItems: 'center',
  },
  activityIndicator: {
    transform: [{ scale: 1.5 }],
  },
  message: {
    ...font.largeBold,
    textAlign: 'center',
    color: color.white,
    marginTop: layout.spacing.md * 1.5,
  },
  caption: {
    ...font.body,
    color: color.white,
    textAlign: 'center',
    marginTop: layout.spacing.sm,
  },
  progressBar: {
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
});
