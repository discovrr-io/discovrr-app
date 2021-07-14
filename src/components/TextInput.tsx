import React, { useState } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
} from 'react-native';

import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import {
  colors as color,
  typography as font,
  values as layout,
} from '../constants';

type TextInputSize = 'small' | 'medium' | 'large';

export type TextInputProps = RNTextInputProps & {
  size?: TextInputSize;
  error?: boolean;
};

export default function TextInput(props: TextInputProps) {
  const {
    size = 'large',
    error = false,
    editable = true,
    secureTextEntry = false,
    ...textInputProps
  } = props;

  const [hidePassword, setHidePassword] = useState(true);
  const [focused, setFocused] = useState(false);

  return (
    <>
      <RNTextInput
        editable={editable}
        placeholderTextColor={color.gray500}
        secureTextEntry={hidePassword && secureTextEntry}
        {...textInputProps}
        style={[
          textInputStyles.textInput,
          secureTextEntry && { paddingRight: 42 },
          size === 'small'
            ? textInputStyles.smallContainer
            : size === 'medium'
            ? textInputStyles.mediumContainer
            : textInputStyles.largeContainer,
          error && { borderColor: color.red500 },
          !editable && { borderColor: color.gray500, color: color.gray500 },
          props.style,
        ]}
      />
      {/* TODO: This icon doesn't have size variants */}
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

// const commonTextInputStyles: TextStyle = {
//   width: '100%',
//   color: color.black,
//   borderRadius: layout.radius.md,
//   paddingHorizontal: layout.spacing.md * 1.5,
//   fontSize: font.size.md,
// };

// type TextInputStyleConstructor = (
//   focused: boolean,
//   error: boolean,
//   editable: boolean,
// ) => ViewStyle;

// const filledTextInputStyles: TextInputStyleConstructor = (
//   focused,
//   error,
//   editable,
// ) => {
//   let backgroundColor: ColorValue;
//   if (error) {
//     if (editable) {
//       backgroundColor = focused && false ? color.red300 : color.red200;
//     } else {
//       backgroundColor = color.red200;
//     }
//   } else {
//     if (editable) {
//       backgroundColor = focused && false ? color.gray200 : color.gray100;
//     } else {
//       backgroundColor = color.gray100;
//     }
//   }
//
//   return {
//     ...commonTextInputStyles,
//     backgroundColor,
//   };
// };

// const outlinedTextInputStyles: TextInputStyleConstructor = (
//   focused,
//   error,
//   editable,
// ) => {
//   let borderColor: ColorValue;
//   if (error) {
//     if (editable) {
//       borderColor = focused ? color.red700 : color.red500;
//     } else {
//       borderColor = color.red300;
//     }
//   } else {
//     if (editable) {
//       borderColor = focused ? color.accentFocused : color.gray500;
//     } else {
//       borderColor = color.gray300;
//     }
//   }
//
//   return {
//     ...commonTextInputStyles,
//     backgroundColor: color.white,
//     borderWidth: layout.border.thin,
//     borderColor,
//   };
// };

const textInputStyles = StyleSheet.create({
  textInput: {
    color: color.black,
    width: '100%',
    backgroundColor: color.white,
    borderWidth: layout.border.thin,
    paddingHorizontal: layout.spacing.md * 1.5,
    fontSize: font.size.md,
  },
  largeContainer: {
    height: layout.buttonSizes.lg,
    borderRadius: layout.radius.lg,
  },
  mediumContainer: {
    height: layout.buttonSizes.md,
    borderRadius: layout.radius.md,
  },
  smallContainer: {
    height: layout.buttonSizes.sm,
    borderRadius: layout.radius.sm,
  },
});
