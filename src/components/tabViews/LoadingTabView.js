import React from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator, Text, View } from 'react-native';

import { typography, values } from '../../constants';

const LoadingTabView = ({ message = 'Loading' }) => {
  return (
    <View style={{ paddingTop: values.spacing.huge }}>
      <View>
        <ActivityIndicator
          style={{ marginBottom: values.spacing.md }}
          size="large"
        />
        <Text style={{ fontSize: typography.size.md, textAlign: 'center' }}>
          {message}
        </Text>
      </View>
    </View>
  );
};

LoadingTabView.propTypes = {
  message: PropTypes.string,
};

export default LoadingTabView;
