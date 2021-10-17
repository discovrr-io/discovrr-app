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

import { color, font, layout } from 'src/constants';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';
import { ButtonSize } from 'src/components/buttons/buttonStyles';

export type TextInputProps = Omit<
  RNTextInputProps,
  | 'style'
  | 'multiline'
  | 'selectionColor'
  | 'placeholderTextColor'
  | 'onPressIn'
  | 'onPressOut'
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
      prefix,
      suffix,
      ...restProps
    } = props;

    const [isFocused, setIsFocused] = useState(false);

    const textInputVariantStyles: ViewStyle[] = useMemo(() => {
      switch (mode) {
        case 'outlined':
          return [
            outlinedTextInputStyles.container,
            isFocused
              ? outlinedTextInputStyles.focused
              : outlinedTextInputStyles.default,
          ];
        case 'filled':
        default:
          return [
            filledTextInputStyles.container,
            isFocused
              ? filledTextInputStyles.focused
              : filledTextInputStyles.default,
          ];
      }
    }, [mode, isFocused]);

    const textInputHeight = useMemo(() => {
      switch (size) {
        case 'large':
          return layout.buttonSizes.lg;
        case 'medium':
          return layout.buttonSizes.md;
        case 'small':
          return layout.buttonSizes.sm;
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
                  layout.spacing.sm,
              },
            })
          : prefix}
        <RNTextInput
          {...restProps}
          ref={ref}
          placeholderTextColor={color.gray500}
          onPressIn={() => setIsFocused(true)}
          onPressOut={() => setIsFocused(false)}
          selectionColor={Platform.OS === 'ios' ? color.accent : undefined}
          style={[
            font.medium,
            innerTextInputStyle,
            { flexGrow: 1, flexShrink: 1, padding: 0 },
          ]}
        />
        {React.isValidElement(suffix)
          ? React.cloneElement(suffix, {
              containerStyle: {
                marginLeft:
                  commonTextInputContainerStyle.paddingHorizontal ??
                  layout.spacing.sm,
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
  paddingVertical: layout.spacing.sm,
  paddingHorizontal: layout.spacing.md * 1.3,
  borderRadius: layout.radius.sm,
};

const filledTextInputStyles = StyleSheet.create({
  container: {
    ...commonTextInputContainerStyle,
  },
  default: {
    backgroundColor: color.gray100,
  },
  focused: {
    backgroundColor: color.gray200,
  },
});

const outlinedTextInputStyles = StyleSheet.create({
  container: {
    ...commonTextInputContainerStyle,
    borderWidth: layout.border.thin,
    borderColor: color.black,
    paddingHorizontal: layout.spacing.md * 1.2,
  },
  default: {},
  focused: {
    backgroundColor: color.gray100,
  },
});

type TextInputAffixProps = {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

const TextInputAffix = (props: TextInputAffixProps) => {
  const { text, textStyle, containerStyle } = props;
  return (
    <View style={[{ justifyContent: 'center' }, containerStyle]}>
      <Text style={[font.medium, { color: color.gray500 }, textStyle]}>
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

  return (
    <TouchableOpacity
      activeOpacity={activeOpacity ?? DEFAULT_ACTIVE_OPACITY * 0.5}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[{ justifyContent: 'center' }, containerStyle]}>
      <Icon {...iconProps} />
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
