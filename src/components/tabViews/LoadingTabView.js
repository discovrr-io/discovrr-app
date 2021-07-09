import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, typography, values } from '../../constants';

/**
 * @typedef {{ message?: string }} LoadingTabViewProps
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {LoadingTabViewProps & ViewProps} param0
 * @returns
 */
const LoadingTabView = ({ message = 'Loading...', ...props }) => {
  return (
    <View
      style={[
        {
          paddingTop: values.spacing.huge,
          paddingBottom: values.spacing.sm,
          alignItems: 'center',
        },
        props.style,
      ]}>
      <ActivityIndicator size="large" color={colors.gray500} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  message: {
    fontSize: typography.size.md,
    fontWeight: '500',
    marginTop: values.spacing.sm,
  },
});

export default LoadingTabView;
