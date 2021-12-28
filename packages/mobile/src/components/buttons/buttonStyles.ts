import {
  ColorValue,
  StyleProp,
  StyleSheet,
  TextProps,
  TextStyle,
  ViewProps,
  ViewStyle,
} from 'react-native';

import { color, font, layout } from 'src/constants';

export type ButtonSize = 'large' | 'medium' | 'small';
export type ButtonType = 'primary' | 'secondary' | 'danger';

export type CommonButtonProps = Omit<ViewProps, 'style'> & {
  title: string;
  size?: ButtonSize;
  type?: ButtonType;
  disabled?: boolean;
  icon?: string;
  loading?: boolean;
  loadingIndicatorColor?: ColorValue | undefined;
  overrideTheme?: 'light-content' | 'dark-content' | undefined;
  underlayColor?: ColorValue | undefined;
  textStyle?: StyleProp<TextStyle>;
  innerTextProps?: Omit<TextProps, 'style' | 'testID'>;
  containerStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
};

export type SizeStyles = {
  container: ViewStyle;
  title: TextStyle;
};

export type ColorStyles = {
  container: {
    default: ViewStyle;
    focused: ViewStyle;
    disabled: ViewStyle;
  };
  title: {
    default: TextStyle;
    disabled: TextStyle;
  };
};

export type ButtonStyles = ReturnType<typeof makeButtonStyles>;

export const commonContainerStyle: ViewStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: layout.spacing.lg,
};

export function makeButtonStyles(
  sizeStyles: SizeStyles,
  colorStyles: ColorStyles,
) {
  return StyleSheet.create({
    defaultContainer: {
      ...commonContainerStyle,
      height: sizeStyles.container.height,
      borderRadius: sizeStyles.container.borderRadius,
      backgroundColor: colorStyles.container.default.backgroundColor,
      borderWidth: colorStyles.container.default.borderWidth,
      borderColor: colorStyles.container.default.borderColor,
    },
    disabledContainer: {
      ...commonContainerStyle,
      height: sizeStyles.container.height,
      borderRadius: sizeStyles.container.borderRadius,
      backgroundColor: colorStyles.container.disabled.backgroundColor,
      borderWidth: colorStyles.container.disabled.borderWidth,
      borderColor: colorStyles.container.disabled.borderColor,
    },
    defaultTitle: {
      ...sizeStyles.title,
      ...colorStyles.title.default,
    },
    disabledTitle: {
      ...sizeStyles.title,
      ...colorStyles.title.disabled,
    },
  });
}

export function makeSizeStyles(size: ButtonSize): SizeStyles {
  switch (size) {
    case 'small':
      return {
        container: {
          height: layout.buttonSizes.sm,
          borderRadius: layout.buttonSizes.sm / 2,
        },
        title: font.smallBold,
      };
    case 'medium':
      return {
        container: {
          height: layout.buttonSizes.md,
          borderRadius: layout.buttonSizes.md / 2,
        },
        title: font.bodyBold,
      };
    case 'large':
      return {
        container: {
          height: layout.buttonSizes.lg,
          borderRadius: layout.buttonSizes.lg / 2,
        },
        title: font.extraLargeBold,
      };
  }
}

export function makeContainedButtonColorStyles(
  type: ButtonType,
  isDarkTheme = false,
): ColorStyles {
  switch (type) {
    case 'primary':
      return {
        container: {
          default: {
            backgroundColor: color.accent,
          },
          focused: {
            backgroundColor: color.accentFocused,
          },
          disabled: {
            backgroundColor: color.accentDisabled,
          },
        },
        title: {
          default: {
            color: color.defaultLightTextColor,
          },
          disabled: {
            color: color.disabledLightTextColor,
          },
        },
      };
    case 'danger':
      return {
        container: {
          default: {
            backgroundColor: color.danger,
          },
          focused: {
            backgroundColor: color.dangerFocused,
          },
          disabled: {
            backgroundColor: color.dangerDisabled,
          },
        },
        title: {
          default: {
            color: color.defaultLightTextColor,
          },
          disabled: {
            color: color.disabledLightTextColor,
          },
        },
      };
    case 'secondary': /* FALLTHROUGH */
    default:
      return {
        container: {
          default: {
            backgroundColor: isDarkTheme ? color.gray100 : color.gray100,
          },
          focused: {
            backgroundColor: isDarkTheme ? color.gray300 : color.gray200,
          },
          disabled: {
            backgroundColor: isDarkTheme ? color.gray700 : color.gray100,
          },
        },
        title: {
          default: {
            color: color.defaultDarkTextColor,
          },
          disabled: {
            color: isDarkTheme
              ? color.defaultDarkTextColor
              : color.disabledDarkTextColor,
          },
        },
      };
  }
}

export function makeOutlinedButtonColorStyles(
  type: ButtonType,
  isDarkTheme = false,
): ColorStyles {
  switch (type) {
    case 'primary':
      return {
        container: {
          default: {
            backgroundColor: 'transparent',
            borderWidth: layout.border.thick,
            borderColor: isDarkTheme ? color.gray300 : color.gray500,
          },
          focused: {
            backgroundColor: isDarkTheme ? color.gray700 : color.gray100,
            borderWidth: layout.border.thick,
            borderColor: isDarkTheme ? color.gray300 : color.gray500,
          },
          disabled: {
            backgroundColor: 'transparent',
            borderWidth: layout.border.thick,
            borderColor: isDarkTheme ? color.gray300 : color.gray500,
          },
        },
        title: {
          default: {
            color: color.accent,
          },
          disabled: {
            color: color.accentDisabled,
          },
        },
      };
    case 'danger':
      return {
        container: {
          default: {
            backgroundColor: 'transparent',
            borderWidth: layout.border.thick,
            borderColor: isDarkTheme ? color.gray300 : color.gray500,
          },
          focused: {
            backgroundColor: isDarkTheme ? color.gray700 : color.gray100,
            borderWidth: layout.border.thick,
            borderColor: isDarkTheme ? color.gray300 : color.gray500,
          },
          disabled: {
            backgroundColor: 'transparent',
            borderWidth: layout.border.thick,
            borderColor: isDarkTheme ? color.gray300 : color.gray500,
          },
        },
        title: {
          default: {
            color: color.danger,
          },
          disabled: {
            color: color.dangerDisabled,
          },
        },
      };
    case 'secondary': /* FALLTHROUGH */
    default:
      return {
        container: {
          default: {
            backgroundColor: 'transparent',
            borderWidth: layout.border.thick,
            borderColor: isDarkTheme ? color.gray300 : color.gray500,
          },
          focused: {
            backgroundColor: isDarkTheme ? color.gray700 : color.gray100,
            borderWidth: layout.border.thick,
            borderColor: isDarkTheme ? color.gray300 : color.gray500,
          },
          disabled: {
            backgroundColor: 'transparent',
            borderWidth: layout.border.thick,
            borderColor: isDarkTheme ? color.gray700 : color.gray300,
          },
        },
        title: {
          default: {
            color: isDarkTheme
              ? color.defaultLightTextColor
              : color.defaultDarkTextColor,
          },
          disabled: {
            color: isDarkTheme ? color.gray700 : color.gray300,
          },
        },
      };
  }
}

export function makeTextButtonColorStyles(
  type: ButtonType,
  isDarkTheme = false,
): ColorStyles {
  const transparentContainer = {
    default: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    focused: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
    disabled: {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
    },
  };

  const disabledTitleColor = isDarkTheme ? color.gray700 : color.gray300;

  switch (type) {
    case 'primary':
      return {
        container: transparentContainer,
        title: {
          default: {
            color: color.accent,
          },
          disabled: {
            color: disabledTitleColor,
          },
        },
      };
    case 'danger':
      return {
        container: transparentContainer,
        title: {
          default: {
            color: color.danger,
          },
          disabled: {
            color: disabledTitleColor,
          },
        },
      };
    case 'secondary': /* FALLTHROUGH */
    default:
      return {
        container: transparentContainer,
        title: {
          default: {
            color: isDarkTheme
              ? color.defaultLightTextColor
              : color.defaultDarkTextColor,
          },
          disabled: {
            color: disabledTitleColor,
          },
        },
      };
  }
}
