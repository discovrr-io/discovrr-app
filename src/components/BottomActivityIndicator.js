import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import { windowWidth } from '../utilities/Constants';

const BottomActivityIndicator = ({ animatingState, refreshColor, bottom }) => (
  <View style={[styles.activityContainer, { bottom: bottom || 20 }]}>
    <ActivityIndicator
      animating={animatingState}
      color={refreshColor || '#00D8C6'}
      size="large"
      style={styles.activityIndicator}
    />
  </View>
);

const styles = StyleSheet.create({
  activityContainer: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    justifyContent: 'center',
    position: 'absolute',
    height: 50,
    width: windowWidth,
  },
  activityIndicator: {
    transform: [{ scale: 1.3 }],
  },
});

export default BottomActivityIndicator;
