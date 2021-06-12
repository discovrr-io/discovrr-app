import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  colors as color,
  typography as font,
  values as layout,
} from '../constants';

export default function TextInput({
  size,
  error,
  secureTextEntry = false,
  ...props
}) {
  const [hidePassword, setHidePassword] = useState(true);

  return (
    <>
      <RNTextInput
        {...props}
        secureTextEntry={hidePassword && secureTextEntry}
        style={[
          textInputStyles.container,
          secureTextEntry && { paddingRight: 42 },
          error && { borderColor: 'red' },
          size === 'small'
            ? textInputStyles.smallContainer
            : textInputStyles.largeContainer,
          props.style,
        ]}
      />
      {!!secureTextEntry && (
        <MaterialCommunityIcon
          size={24}
          name={hidePassword ? 'eye' : 'eye-off'}
          onPress={() => setHidePassword((prev) => !prev)}
          style={{
            position: 'absolute',
            right: 8,
            top: 8,
            padding: 5,
            backgroundColor: color.white,
          }}
        />
      )}
    </>
  );
}

const textInputStyles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: color.white,
    borderRadius: layout.radius.lg,
    borderWidth: layout.border.thin,
    paddingHorizontal: layout.spacing.md * 1.5,
    fontSize: font.size.md,
  },
  largeContainer: {
    height: layout.buttonSizes.large,
  },
  smallContainer: {
    height: layout.buttonSizes.small,
  },
});
