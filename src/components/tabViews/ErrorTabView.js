import React from 'react';
import PropTypes from 'prop-types';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const isDevMode = process.env.NODE_ENV === 'development';
import { colors, typography, values } from '../../constants';

/**
 * @typedef {import('react-native').ViewProps} ViewProps
 * @typedef {{ title?: string, message?: string, error?: any, refreshControl?: any }} ErrorTabViewProps
 * @param {ErrorTabViewProps & ViewProps} param0
 */
const ErrorTabView = ({
  title = '😓',
  message = 'Oops, something went wrong.',
  error = undefined,
  refreshControl = undefined,
  ...props
}) => {
  return (
    <ScrollView
      refreshControl={refreshControl}
      contentContainerStyle={[
        { paddingVertical: values.spacing.huge },
        props.style,
      ]}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <Text style={styles.error}>Please try again later.</Text>
        {/* Only show error in development mode */}
        {isDevMode && (
          <View
            style={{
              marginTop: values.spacing.md,
              paddingHorizontal: values.spacing.md,
            }}>
            <Text style={[styles.error, { marginBottom: values.spacing.md }]}>
              The following message is only shown in development mode:
            </Text>
            <Text style={[styles.error, { textAlign: 'auto' }]}>
              {JSON.stringify(error)}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

ErrorTabView.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  error: PropTypes.any,
  refreshControl: PropTypes.node,
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
  error: {
    ...commonTextStyles,
    color: colors.gray,
  },
});

export default ErrorTabView;
