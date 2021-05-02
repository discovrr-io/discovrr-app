import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';

import { typography, values } from '../../constants';

const EmptyTabView = ({ message = "It's quiet here" }) => {
  return (
    <View style={{ paddingTop: values.spacing.huge }}>
      <View>
        <Text style={styles.title}>🤔</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
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
