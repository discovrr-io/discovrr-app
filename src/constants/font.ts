import { Platform, TextStyle } from 'react-native';

export interface FontFamily {
  readonly '100': string;
  readonly '200': string;
  readonly '300': string;
  readonly '400': string;
  readonly '500': string;
  readonly '600': string;
  readonly '700': string;
  readonly '800': string;
  readonly '900': string;

  get normal(): string;
  get medium(): string;
  get bold(): string;
}

export const AirbnbCerealApp: FontFamily = {
  '100': 'AirbnbCerealApp-Light',
  '200': 'AirbnbCerealApp-Light',
  '300': 'AirbnbCerealApp-Light',
  '400': 'AirbnbCerealApp-Book',
  '500': 'AirbnbCerealApp-Medium',
  '600': 'AirbnbCerealApp-Medium',
  '700': 'AirbnbCerealApp-Bold',
  '800': 'AirbnbCerealApp-ExtraBold',
  '900': 'AirbnbCerealApp-Black',

  get normal() {
    return this[400];
  },
  get medium() {
    return this[500];
  },
  get bold() {
    return this[700];
  },
};

export const FONT_FAMILY = AirbnbCerealApp;

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

export const familyRegularFontTextStyles: TextStyle = {
  fontFamily: FONT_FAMILY.normal,
  fontWeight: Platform.select({ ios: '400' }),
};

export const familyMediumFontTextStyles: TextStyle = {
  ...familyRegularFontTextStyles,
  fontFamily: FONT_FAMILY.medium,
  fontWeight: Platform.select({ ios: '500' }),
};

export const familyBoldFontTextStyles: TextStyle = {
  ...familyRegularFontTextStyles,
  fontFamily: FONT_FAMILY.bold,
  fontWeight: Platform.select({ ios: '700' }),
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

export const defaultHeaderTitleStyle: TextStyle = largeBold;

export const defaultBottomTabLabelStyle: TextStyle = extraSmallBold;

export const defaultTopTabBarLabelStyle: TextStyle = {
  ...bodyMedium,
  textTransform: 'none',
};
