import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { colors, typography, values } from '../constants';

/**
 * @param {{ message: string }} param0
 */
export default function LoadingOverlay({ message }) {
  return (
    <View
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignContent: 'center',
        justifyContent: 'center',
        zIndex: 1,
      }}>
      <View style={{ alignContent: 'center' }}>
        <ActivityIndicator
          size="large"
          color={colors.white}
          style={{ transform: [{ scale: 1.5 }] }}
        />
        <Text
          style={{
            color: colors.white,
            fontSize: typography.size.lg,
            fontWeight: '700',
            textAlign: 'center',
            marginTop: values.spacing.md * 1.5,
          }}>
          {message}
        </Text>
        <Text
          style={{
            color: colors.white,
            fontSize: typography.size.md,
            textAlign: 'center',
            marginTop: values.spacing.sm,
          }}>
          This may take a while
        </Text>
      </View>
    </View>
  );
}