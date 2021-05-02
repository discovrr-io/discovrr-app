import React from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors, typography, values } from '../../constants';

const LoadingTabView = ({ message = 'Loading' }) => {
  return (
    <View style={{ paddingTop: values.spacing.huge }}>
      <View>
        <ActivityIndicator
          size="large"
          color={colors.black}
          style={{ marginBottom: values.spacing.md }}
        />
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

LoadingTabView.propTypes = {
  message: PropTypes.string,
};

const commonTextStyles = {
  textAlign: 'center',
};

const styles = StyleSheet.create({
  message: {
    ...commonTextStyles,
    fontSize: typography.size.md,
    fontWeight: '500',
    marginBottom: values.spacing.sm,
  },
});

export default LoadingTabView;
