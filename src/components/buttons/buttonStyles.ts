import {
  ColorValue,
  StyleProp,
  StyleSheet,
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
  loading?: boolean;
  onPress?: () => void;
  underlayColor?: ColorValue | undefined;
  loadingIndicatorColor?: ColorValue | undefined;
  containerStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
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
  borderWidth: layout.border.thin,
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
      borderColor: colorStyles.container.default.borderColor,
    },
    disabledContainer: {
      ...commonContainerStyle,
      height: sizeStyles.container.height,
      borderRadius: sizeStyles.container.borderRadius,
      backgroundColor: colorStyles.container.disabled.backgroundColor,
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
          borderRadius: layout.radius.sm,
        },
        title: font.smallBold,
      };
    case 'medium':
      return {
        container: {
          height: layout.buttonSizes.md,
          borderRadius: layout.radius.md,
        },
        title: font.mediumBold,
      };
    case 'large':
      return {
        container: {
          height: layout.buttonSizes.lg,
          borderRadius: layout.radius.md,
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
            borderColor: color.accent,
          },
          focused: {
            backgroundColor: color.accentFocused,
            borderColor: color.accentFocused,
          },
          disabled: {
            backgroundColor: color.accentDisabled,
            borderColor: color.accentDisabled,
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
            borderColor: color.danger,
          },
          focused: {
            backgroundColor: color.dangerFocused,
            borderColor: color.dangerFocused,
          },
          disabled: {
            backgroundColor: color.dangerDisabled,
            borderColor: color.dangerDisabled,
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
            backgroundColor: color.gray100,
            borderColor: color.gray100,
            // borderColor: 'transparent',
          },
          focused: {
            backgroundColor: color.gray200,
            borderColor: color.gray200,
            // borderColor: 'transparent',
          },
          disabled: {
            backgroundColor: color.white,
            borderColor: color.white,
            // borderColor: 'transparent',
          },
        },
        title: {
          default: {
            color: isDarkTheme
              ? color.defaultLightTextColor
              : color.defaultDarkTextColor,
          },
          disabled: {
            color: color.disabledDarkTextColor,
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
            borderColor: color.accent,
          },
          focused: {
            backgroundColor: color.blue200,
            borderColor: color.accent,
          },
          disabled: {
            backgroundColor: 'transparent',
            borderColor: color.accentDisabled,
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
            borderColor: color.danger,
          },
          focused: {
            backgroundColor: color.red200,
            borderColor: color.danger,
          },
          disabled: {
            backgroundColor: 'transparent',
            borderColor: color.dangerDisabled,
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
            borderColor: isDarkTheme ? color.white : color.black,
          },
          focused: {
            backgroundColor: isDarkTheme ? color.gray700 : color.gray200,
            borderColor: isDarkTheme ? color.white : color.black,
          },
          disabled: {
            backgroundColor: 'transparent',
            borderColor: isDarkTheme ? color.gray200 : color.gray500,
          },
        },
        title: {
          default: {
            color: isDarkTheme
              ? color.defaultLightTextColor
              : color.defaultDarkTextColor,
          },
          disabled: {
            color: color.disabledDarkTextColor,
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

  switch (type) {
    case 'primary':
      return {
        container: transparentContainer,
        title: {
          default: {
            color: color.accent,
          },
          disabled: {
            color: color.disabledDarkTextColor,
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
            color: color.disabledDarkTextColor,
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
            color: color.disabledDarkTextColor,
          },
        },
      };
  }
}