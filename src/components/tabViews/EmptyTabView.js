import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { typography, values } from '../../constants';

/**
 * @typedef {{ title?: string, message?: string, refreshControl?: any }} EmptyTabViewProps
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {EmptyTabViewProps & ViewProps} param0
 * @returns
 */
const EmptyTabView = ({
  title = '🤔',
  message = "It's quiet here",
  refreshControl = undefined,
  ...props
}) => {
  return (
    <View
      // refreshControl={refreshControl}
      style={[{ paddingTop: values.spacing.huge }, props.style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

EmptyTabView.propTypes = {
  message: PropTypes.string,
};

const commonTextStyles = {
  textAlign: 'center',
};

const styles = StyleSheet.create({
  title: {
    ...commonTextStyles,
    fontSize: 30,
    marginBottom: values.spacing.md,
  },
  message: {
    ...commonTextStyles,
    fontSize: typography.size.md,
    fontWeight: '500',
    marginBottom: values.spacing.sm,
  },
});

export default EmptyTabView;
