import * as React from 'react';
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

import {
  withFormikVariant,
  withLabelledFormikVariant,
  withLabelledVariant,
} from './hocs';

export type TextInputProps = Omit<
  RNTextInputProps,
  'style' | 'multiline' | 'selectionColor' | 'onPressIn' | 'onPressOut'
> & {
  size?: ButtonSize;
  variant?: 'filled' | 'outlined';
  containerStyle?: StyleProp<ViewStyle>;
  innerTextInputStyle?: StyleProp<TextStyle>;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string;
};

export const __TextInput = React.forwardRef<RNTextInput, TextInputProps>(
  (props: TextInputProps, ref) => {
    const {
      size = 'medium',
      variant = 'filled',
      containerStyle,
      innerTextInputStyle,
      placeholderTextColor,
      editable,
      error,
      prefix,
      suffix,
      ...restProps
    } = props;

    const { dark, colors } = useExtendedTheme();
    const [isFocused, setIsFocused] = React.useState(false);

    const textInputVariantStyles: StyleProp<ViewStyle> = React.useMemo(() => {
      switch (variant) {
        case 'outlined':
          return [
            outlinedTextInputStyles.container,
            outlinedTextInputStyles.default,
            editable &&
              isFocused && { backgroundColor: constants.color.gray100 },
          ];
        case 'filled':
        default:
          return [
            filledTextInputStyles.container,
            {
              backgroundColor:
                colors.background +
                (editable === false ? utilities.percentToHex(0.35) : ''),
            },
            editable &&
              isFocused && {
                backgroundColor:
                  colors.highlight + (dark ? utilities.percentToHex(0.1) : ''),
              },
            !!error && {
              backgroundColor:
                colors.dangerDisabled + utilities.percentToHex(0.5),
              borderWidth: 1,
              borderColor: colors.danger,
            },
          ];
      }
    }, [
      variant,
      isFocused,
      colors.background,
      colors.highlight,
      colors.dangerDisabled,
      colors.danger,
      dark,
      editable,
      error,
    ]);

    const textInputHeight = React.useMemo(() => {
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
      <View style={[containerStyle, { minHeight: textInputHeight }]}>
        <View style={[textInputVariantStyles, { height: textInputHeight }]}>
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
            editable={editable}
            placeholderTextColor={
              placeholderTextColor ??
              (dark
                ? error
                  ? constants.color.red100
                  : constants.color.gray700
                : error
                ? constants.color.red300
                : constants.color.gray500)
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
        {error && (
          <Text
            style={[
              constants.font.medium,
              {
                color: colors.danger,
                paddingTop: constants.layout.spacing.sm,
                paddingHorizontal: constants.layout.spacing.sm,
              },
            ]}>
            {error}
          </Text>
        )}
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
  disabled?: TouchableOpacityProps['disabled'];
  activeOpacity?: TouchableOpacityProps['activeOpacity'];
  containerStyle?: StyleProp<ViewStyle>;
};

const TextInputIcon = (props: TextInputIconProps) => {
  const {
    disabled,
    activeOpacity,
    containerStyle,
    onPress,
    onLongPress,
    ...iconProps
  } = props;

  const { colors } = useExtendedTheme();

  return (
    <TouchableOpacity
      disabled={disabled}
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

export const FormikTextInput = withFormikVariant(TextInput);
export const LabelledTextInput = withLabelledVariant(TextInput);
export const LabelledFormikTextInput = withLabelledFormikVariant(TextInput);

export default TextInput;
