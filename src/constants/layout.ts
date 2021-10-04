import { ViewStyle } from 'react-native';

const SPACING_UNIT = 8;

export const spacing = {
  huge: SPACING_UNIT ** 2,
  xxl: SPACING_UNIT * 4,
  xl: SPACING_UNIT * 3,
  lg: SPACING_UNIT * 2,
  md: SPACING_UNIT,
  sm: SPACING_UNIT / 2,
  xs: SPACING_UNIT / 4,
  zero: 0,
};

export const radius = {
  lg: 16,
  md: 12,
  sm: 8,
  zero: 0,
};

export const border = {
  thick: 2,
  thin: 1,
  zero: 0,
};

export const defaultScreenMargins = {
  horizontalHeader: spacing.lg,
  verticalHeader: spacing.xl,
  horizontal: spacing.md,
  vertical: spacing.md,
};

export const defaultScreenStyle: ViewStyle = {
  paddingVertical: defaultScreenMargins.vertical,
  paddingHorizontal: defaultScreenMargins.horizontal,
};

export const buttonSizes = {
  lg: 48,
  md: 40,
  sm: 32,
};
