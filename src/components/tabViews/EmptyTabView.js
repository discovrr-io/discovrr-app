import React from 'react';
import PropTypes from 'prop-types';
import { Text, View } from 'react-native';

import { typography, values } from '../../constants';

const EmptyTabView = ({ message = "It's quiet here" }) => {
  return (
    <View style={{ paddingTop: values.spacing.huge }}>
      <View>
        <Text
          style={{
            fontSize: 36,
            textAlign: 'center',
            marginBottom: values.spacing.md,
          }}>
          🤔
        </Text>
        <Text style={{ fontSize: typography.size.md, textAlign: 'center' }}>
          {message}
        </Text>
      </View>
    </View>
  );
};

EmptyTabView.propTypes = {
  message: PropTypes.string,
};

export default EmptyTabView;
