import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';

const isDevMode = process.env.NODE_ENV === 'development';
import { colors, typography, values } from '../../constants';

/**
 * @typedef {{ title?: string, message?: string, caption?: string, error?: any, refreshControl?: any }} ErrorTabViewProps
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {ErrorTabViewProps & ViewProps} param0
 */
const ErrorTabView = ({
  title = '😓',
  message = 'Oops, something went wrong.',
  caption = 'Please try again later.',
  error = undefined,
  refreshControl = undefined,
  ...props
}) => {
  return (
    <View style={[styles.container, props.style]}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.error}>{caption}</Text>
      {/* Only show error in development mode */}
      {false && isDevMode && (
        <View
          style={{
            marginTop: values.spacing.md,
            paddingHorizontal: values.spacing.md,
          }}>
          {error && (
            <>
              <Text style={[styles.error, { marginBottom: values.spacing.sm }]}>
                The following message is only shown in development mode:
              </Text>
              <Text style={[styles.error]}>
                {error?.message ?? JSON.stringify(error)}
              </Text>
            </>
          )}
        </View>
      )}
    </View>
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
  container: {
    flexGrow: 1,
    paddingVertical: values.spacing.huge,
    marginHorizontal: values.spacing.xl,
  },
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
