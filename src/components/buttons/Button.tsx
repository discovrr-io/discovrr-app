import * as React from 'react';
import { useTheme } from '@react-navigation/native';

import ButtonBase from './ButtonBase';
import {
  CommonButtonProps,
  makeButtonStyles,
  makeContainedButtonColorStyles,
  makeOutlinedButtonColorStyles,
  makeSizeStyles,
  makeTextButtonColorStyles,
} from './buttonStyles';

export { ButtonBaseTestId as ButtonTestId } from './ButtonBase';

export type ButtonProps = CommonButtonProps & {
  variant?: 'text' | 'outlined' | 'contained';
};

export default function Button(props: ButtonProps) {
  const {
    variant = 'text',
    type = 'secondary',
    size = 'large',
    overrideTheme,
    ...restProps
  } = props;

  const { dark } = useTheme();
  const isDarkTheme = React.useMemo(() => {
    if (overrideTheme === undefined) return dark;
    return overrideTheme !== 'dark-content';
  }, [dark, overrideTheme]);

  const sizeStyles = React.useMemo(() => makeSizeStyles(size), [size]);
  const colorStyles = React.useMemo(() => {
    switch (variant) {
      case 'contained':
        return makeContainedButtonColorStyles(type, isDarkTheme);
      case 'outlined':
        return makeOutlinedButtonColorStyles(type, isDarkTheme);
      case 'text':
      default:
        return makeTextButtonColorStyles(type, isDarkTheme);
    }
  }, [isDarkTheme, type, variant]);

  const buttonStyles = React.useMemo(
    () => makeButtonStyles(sizeStyles, colorStyles),
    [sizeStyles, colorStyles],
  );

  return (
    <ButtonBase
      type={type}
      size={size}
      useTouchableOpacity={variant === 'text'}
      underlayColor={colorStyles.container.focused.backgroundColor}
      buttonStyles={buttonStyles}
      {...restProps}
    />
  );
}
