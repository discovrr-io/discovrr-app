import React, { useMemo } from 'react';

import { ButtonBase } from './ButtonBase';
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
    ...restProps
  } = props;

  const isDarkTheme = false;
  const sizeStyles = useMemo(() => makeSizeStyles(size), [size]);
  const colorStyles = useMemo(() => {
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

  const buttonStyles = useMemo(
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
