import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  TouchableOpacity,
} from 'react-native';

import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  colors as color,
  colors,
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
          secureTextEntry && { paddingRight: 40 },
          error && { borderColor: 'red' },
          size === 'small'
            ? textInputStyles.smallContainer
            : textInputStyles.largeContainer,
          props.style,
        ]}
      />
      {!!secureTextEntry && (
        <TouchableOpacity
          onPress={() => setHidePassword((prev) => !prev)}
          style={{
            position: 'absolute',
            right: 10,
            top: 11,
            padding: 2,
            backgroundColor: colors.white,
          }}>
          <MaterialCommunityIcon
            size={24}
            name={hidePassword ? 'eye-off' : 'eye'}
          />
        </TouchableOpacity>
      )}
    </>
  );
}

const textInputStyles = StyleSheet.create({
  container: {
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
