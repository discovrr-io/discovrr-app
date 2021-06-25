import React, { useState } from 'react';
import { StyleSheet, TextInput as RNTextInput } from 'react-native';

import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  colors as color,
  typography as font,
  values as layout,
} from '../constants';

export default function TextInput({
  size = 'big',
  editable = true,
  error = undefined,
  secureTextEntry = false,
  ...props
}) {
  const [hidePassword, setHidePassword] = useState(true);

  return (
    <>
      <RNTextInput
        editable={editable}
        placeholderTextColor={color.gray500}
        secureTextEntry={hidePassword && secureTextEntry}
        {...props}
        style={[
          textInputStyles.textInput,
          size === 'small'
            ? textInputStyles.smallContainer
            : textInputStyles.largeContainer,
          secureTextEntry && { paddingRight: 42 },
          error && { borderColor: 'red' },
          !editable && { borderColor: color.gray500, color: color.gray500 },
          props.style,
        ]}
      />
      {!!secureTextEntry && (
        <MaterialCommunityIcon
          size={24}
          name={hidePassword ? 'eye' : 'eye-off'}
          onPress={() => setHidePassword((prev) => !prev)}
          color={editable ? color.black : color.gray500}
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
  textInput: {
    color: color.black,
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
