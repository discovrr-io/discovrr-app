import React from 'react';
import PropTypes from 'prop-types';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
const AnimatedFastImage = Animated.createAnimatedComponent(FastImage);
const discovrrIcon = require('../../../resources/assets/icon.jpg');

import { typography, values } from '../../constants';

const DISCOVRR_ICON_RADIUS = 32;

const LoadingTabView = ({ message = 'Loading...', ...props }) => {
  const [spinValue, setSpinValue] = React.useState(new Animated.Value(0));
  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start(() => setSpinValue(0));
  });

  return (
    <View
      style={[
        { paddingTop: values.spacing.huge, alignItems: 'center' },
        props.style,
      ]}>
      <AnimatedFastImage
        style={{
          width: DISCOVRR_ICON_RADIUS,
          height: DISCOVRR_ICON_RADIUS,
          marginBottom: values.spacing.md,
          transform: [{ rotate: spin }],
        }}
        source={discovrrIcon}
      />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

LoadingTabView.propTypes = {
  message: PropTypes.string,
};

const styles = StyleSheet.create({
  message: {
    fontSize: typography.size.md,
    fontWeight: '500',
    marginBottom: values.spacing.sm,
    // textAlign: 'center',
  },
});

export default LoadingTabView;
