import { Platform, TextStyle } from 'react-native';

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

const familyRegularFontTextStyles: TextStyle = {
  fontFamily: FONT_FAMILY_REGULAR,
};

const familyMediumFontTextStyles: TextStyle = {
  ...familyRegularFontTextStyles,
  fontFamily: FONT_FAMILY_MEDIUM,
};

const familyBoldFontTextStyles: TextStyle = {
  ...familyRegularFontTextStyles,
  fontFamily: FONT_FAMILY_BOLD,
  fontWeight: Platform.select({ ios: 'bold' }),
};

export const title: TextStyle = {
  ...familyBoldFontTextStyles,
  fontSize: size.title,
};

export const h1: TextStyle = {
  ...familyBoldFontTextStyles,
  fontSize: size.h1,
};

export const h2: TextStyle = {
  ...familyBoldFontTextStyles,
  fontSize: size.h2,
};

export const h3: TextStyle = {
  ...familyBoldFontTextStyles,
  fontSize: size.h3,
};

export const extraLarge: TextStyle = {
  ...familyRegularFontTextStyles,
  fontSize: size.xl,
};

export const extraLargeMedium: TextStyle = {
  ...extraLarge,
  ...familyMediumFontTextStyles,
};

export const extraLargeBold: TextStyle = {
  ...extraLarge,
  ...familyBoldFontTextStyles,
};

export const large: TextStyle = {
  ...familyRegularFontTextStyles,
  fontSize: size.lg,
};

export const largeMedium: TextStyle = {
  ...large,
  ...familyMediumFontTextStyles,
};

export const largeBold: TextStyle = {
  ...large,
  ...familyBoldFontTextStyles,
};

export const body: TextStyle = {
  ...familyRegularFontTextStyles,
  fontSize: size.md,
};

export const bodyMedium: TextStyle = {
  ...body,
  ...familyMediumFontTextStyles,
};

export const bodyBold: TextStyle = {
  ...body,
  ...familyBoldFontTextStyles,
};

export const small: TextStyle = {
  ...familyRegularFontTextStyles,
  fontSize: size.sm,
};

export const smallMedium: TextStyle = {
  ...small,
  ...familyMediumFontTextStyles,
};

export const smallBold: TextStyle = {
  ...small,
  ...familyBoldFontTextStyles,
};

export const extraSmall: TextStyle = {
  ...familyRegularFontTextStyles,
  fontSize: size.xs,
};

export const extraSmallMedium: TextStyle = {
  ...extraSmall,
  ...familyMediumFontTextStyles,
};

export const extraSmallBold: TextStyle = {
  ...extraSmall,
  ...familyBoldFontTextStyles,
};

export const defaultHeaderTitleStyle = extraLargeBold;

export const defaultBottomTabLabelStyle = extraSmallMedium;

export const defaultTopTabBarLabelStyle: TextStyle = {
  ...bodyMedium,
  textTransform: 'none',
};
