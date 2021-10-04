import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Portal } from '@gorhom/portal';

import { color, font, layout } from 'src/constants';

type LoadingOverlayProps = {
  message?: string;
  caption?: string;
};

export default function LoadingOverlay(props: LoadingOverlayProps) {
  const { message, caption } = props;
  return (
    <Portal>
      <View style={styles.container}>
        <View style={{ alignContent: 'center' }}>
          <ActivityIndicator
            size="large"
            color={color.white}
            style={styles.activityIndicator}
          />
          <Text style={styles.message}>{message || 'Loading...'}</Text>
          <Text style={styles.caption}>
            {caption || 'This may take a while'}
          </Text>
        </View>
      </View>
    </Portal>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignContent: 'center',
    justifyContent: 'center',
    // zIndex: 1,
    // elevation: 1,
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
    ...font.medium,
    color: color.white,
    textAlign: 'center',
    marginTop: layout.spacing.sm,
  },
});
