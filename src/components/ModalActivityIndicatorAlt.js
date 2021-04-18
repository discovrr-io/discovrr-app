import React from 'react';

import {
  ActivityIndicator,
  View,
} from 'react-native';

const ModalActivityIndicatorAlt = ({ isProcessing = true, color, hideIndicator = false, opacity = 0.6 }) => (
  <View
    style={{
      zIndex: 10000,
      position: 'absolute',
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: `rgba(0, 0, 0, ${opacity})`,
    }}
  >
    {!hideIndicator && (
      <ActivityIndicator
        animating={isProcessing}
        color={color || '#ECEFF1'}
        size="large"
        style={{ transform: [{ scale: 1.5 }] }}
      />
    )}
  </View>
);

export default ModalActivityIndicatorAlt;
