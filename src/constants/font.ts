import { TextStyle } from 'react-native';

import * as color from './color';

export const FONT_FAMILY_BOLD = 'Rubik-Bold';
export const FONT_FAMILY_ITALIC = 'Rubik-Italic';
export const FONT_FAMILY_MEDIUM = 'Rubik-Medium';
export const FONT_FAMILY_REGULAR = 'Rubik-Regular';

export const size = {
  title: 64,
  h1: 48,
  h2: 36,
  h3: 24,
  xl: 20,
  lg: 18,
  md: 16,
  sm: 14,
  xs: 12,
};

const regularFontTextStyles: TextStyle = {
  color: color.defaultDarkTextColor,
  fontFamily: FONT_FAMILY_REGULAR,
};

const boldFontTextStyles: TextStyle = {
  ...regularFontTextStyles,
  fontFamily: FONT_FAMILY_BOLD,
};

const mediumFontTextStyles: TextStyle = {
  ...regularFontTextStyles,
  fontFamily: FONT_FAMILY_MEDIUM,
};

export const title: TextStyle = {
  ...boldFontTextStyles,
  fontSize: size.title,
};

export const h1: TextStyle = {
  ...boldFontTextStyles,
  fontSize: size.h1,
};

export const h2: TextStyle = {
  ...boldFontTextStyles,
  fontSize: size.h2,
};

export const h3: TextStyle = {
  ...regularFontTextStyles,
  fontSize: size.h3,
};

export const extraLarge: TextStyle = {
  ...regularFontTextStyles,
  fontSize: size.xl,
};

export const extraLargeBold: TextStyle = {
  ...extraLarge,
  ...mediumFontTextStyles,
};

export const large: TextStyle = {
  ...regularFontTextStyles,
  fontSize: size.lg,
};

export const largeBold: TextStyle = {
  ...large,
  ...mediumFontTextStyles,
};

export const medium: TextStyle = {
  ...regularFontTextStyles,
  fontSize: size.md,
};

export const mediumBold: TextStyle = {
  ...medium,
  ...mediumFontTextStyles,
};

export const small: TextStyle = {
  ...regularFontTextStyles,
  fontSize: size.sm,
};

export const smallBold: TextStyle = {
  ...small,
  ...mediumFontTextStyles,
};

export const extraSmall: TextStyle = {
  ...regularFontTextStyles,
  fontSize: size.xs,
};

export const extraSmallBold: TextStyle = {
  ...extraSmall,
  ...mediumFontTextStyles,
};

const { color: _1, ...defaultHeaderTitleStyleWithoutColor } = largeBold;
export const defaultHeaderTitleStyle = defaultHeaderTitleStyleWithoutColor;

const { color: _2, ...defaultTabBarLabelStyleWithoutColor } = medium;
export const defaultTabBarLabelStyle: TextStyle = {
  ...defaultTabBarLabelStyleWithoutColor,
  textTransform: 'none',
};
