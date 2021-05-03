import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';

const isDevMode = process.env.NODE_ENV === 'development';
import { colors, typography, values } from '../../constants';

const ErrorTabView = ({
  title = '😓',
  message = 'Oops, something went wrong.\nPlease try again later.',
  error,
}) => {
  return (
    <View style={{ paddingTop: values.spacing.huge }}>
      <View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        {/* Only show error in development mode */}
        {isDevMode && (
          <>
            <Text style={styles.error}>
              The following message is only shown in development mode:
            </Text>
            <Text style={styles.error}>{`${error}`}</Text>
          </>
        )}
      </View>
    </View>
  );
};

ErrorTabView.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  error: PropTypes.any,
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
