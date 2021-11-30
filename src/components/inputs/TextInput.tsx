import React, { useMemo, useState } from 'react';
import {
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { IconProps } from 'react-native-vector-icons/Icon';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';
import { ButtonSize } from 'src/components/buttons/buttonStyles';
import { useExtendedTheme } from 'src/hooks';

export type TextInputProps = Omit<
  RNTextInputProps,
  'style' | 'multiline' | 'selectionColor' | 'onPressIn' | 'onPressOut'
> & {
  size?: ButtonSize;
  mode?: 'filled' | 'outlined';
  hasError?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
  innerTextInputStyle?: StyleProp<TextStyle>;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
};

export const __TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  (props: TextInputProps, ref) => {
    const {
      size = 'medium',
      mode = 'filled',
      containerStyle,
      innerTextInputStyle,
      placeholderTextColor,
      prefix,
      suffix,
      ...restProps
    } = props;

    const { dark, colors } = useExtendedTheme();
    const [isFocused, setIsFocused] = useState(false);

    const textInputVariantStyles: StyleProp<ViewStyle> = useMemo(() => {
      switch (mode) {
        case 'outlined':
          return [
            outlinedTextInputStyles.container,
            isFocused
              ? { backgroundColor: constants.color.gray100 }
              : outlinedTextInputStyles.default,
          ];
        case 'filled':
        default:
          return [
            filledTextInputStyles.container,
            {
              backgroundColor: isFocused
                ? colors.highlight + (dark ? utilities.percentToHex(0.35) : '')
                : colors.background,
            },
          ];
      }
    }, [mode, isFocused, dark, colors.highlight, colors.background]);

    const textInputHeight = useMemo(() => {
      switch (size) {
        case 'large':
          return constants.layout.buttonSizes.lg;
        case 'medium':
          return constants.layout.buttonSizes.md;
        case 'small':
          return constants.layout.buttonSizes.sm;
      }
    }, [size]);

    return (
      <View
        style={[
          textInputVariantStyles,
          { height: textInputHeight },
          containerStyle,
        ]}>
        {React.isValidElement(prefix)
          ? React.cloneElement(prefix, {
              containerStyle: {
                marginRight:
                  commonTextInputContainerStyle.paddingHorizontal ??
                  constants.layout.spacing.sm,
              },
            })
          : prefix}
        <RNTextInput
          {...restProps}
          ref={ref}
          placeholderTextColor={
            placeholderTextColor ??
            (dark ? constants.color.gray700 : constants.color.gray500)
          }
          onPressIn={() => setIsFocused(true)}
          onPressOut={() => setIsFocused(false)}
          selectionColor={
            Platform.OS === 'ios' ? constants.color.accent : undefined
          }
          style={[
            constants.font.medium,
            { color: colors.text },
            innerTextInputStyle,
            { flexGrow: 1, flexShrink: 1, padding: 0 },
          ]}
        />
        {React.isValidElement(suffix)
          ? React.cloneElement(suffix, {
              containerStyle: {
                marginLeft:
                  commonTextInputContainerStyle.paddingHorizontal ??
                  constants.layout.spacing.sm,
              },
            })
          : suffix}
      </View>
    );
  },
);

const commonTextInputContainerStyle: ViewStyle = {
  flexGrow: 1,
  flexDirection: 'row',
  justifyContent: 'center',
  paddingVertical: constants.layout.spacing.sm,
  paddingHorizontal: constants.layout.spacing.md * 1.3,
  borderRadius: constants.layout.radius.sm,
};

const filledTextInputStyles = StyleSheet.create({
  container: {
    ...commonTextInputContainerStyle,
  },
  default: {},
  focused: {},
});

const outlinedTextInputStyles = StyleSheet.create({
  container: {
    ...commonTextInputContainerStyle,
    borderWidth: constants.layout.border.thin,
    borderColor: constants.color.black,
    paddingHorizontal: constants.layout.spacing.md * 1.2,
  },
  default: {},
  focused: {},
});

type TextInputAffixProps = {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

const TextInputAffix = (props: TextInputAffixProps) => {
  const { text, textStyle, containerStyle } = props;
  const { dark } = useExtendedTheme();

  return (
    <View style={[{ justifyContent: 'center' }, containerStyle]}>
      <Text
        style={[
          constants.font.medium,
          { color: dark ? constants.color.gray700 : constants.color.gray500 },
          textStyle,
        ]}>
        {text}
      </Text>
    </View>
  );
};

type TextInputIconProps = IconProps & {
  activeOpacity?: TouchableOpacityProps['activeOpacity'];
  containerStyle?: StyleProp<ViewStyle>;
};

const TextInputIcon = (props: TextInputIconProps) => {
  const { activeOpacity, containerStyle, onPress, onLongPress, ...iconProps } =
    props;

  const { colors } = useExtendedTheme();

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity ?? DEFAULT_ACTIVE_OPACITY * 0.5}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[{ justifyContent: 'center' }, containerStyle]}>
      <Icon color={colors.text} {...iconProps} />
    </TouchableOpacity>
  );
};

const TextInput = __TextInput as typeof __TextInput & {
  Affix: typeof TextInputAffix;
  Icon: typeof TextInputIcon;
};

TextInput.Affix = TextInputAffix;
TextInput.Icon = TextInputIcon;

export default TextInput;
