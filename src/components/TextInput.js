import React from 'react';
import { StyleSheet, TextInput as RNTextInput } from 'react-native';

export default function TextInput({
  size,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoComplete,
  autoCorrect,
}) {
  return (
    <RNTextInput
      style={[
        textInputStyles.container,
        size === 'small'
          ? textInputStyles.smallContainer
          : textInputStyles.largeContainer,
      ]}
      placeholder={placeholder}
    />
  );
}

const textInputStyles = StyleSheet.create({
  container: {
    backgroundColor: color.white,
    borderRadius: layout.radius.md,
    borderWidth: layout.border.thick,
    padding: layout.spacing.md,
    ...font.medium,
  },
  largeContainer: {
    height: layout.buttonSizes.large,
  },
  smallContainer: {
    height: layout.buttonSizes.small,
  },
});
