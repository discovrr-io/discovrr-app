import { Platform, ViewStyle } from 'react-native';

const SPACING_UNIT = 8;
const RADIUS_UNIT = 8;

export type Spacing = {
  huge: number;
  xxl: number;
  xl: number;
  lg: number;
  md: number;
  sm: number;
  xs: number;
  zero: number;
};

export const spacing: Spacing = {
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
  lg: RADIUS_UNIT * 2,
  md: RADIUS_UNIT * 1.5,
  sm: RADIUS_UNIT,
  zero: 0,
};

export const border = {
  thick: 1.75,
  thin: 1,
  zero: 0,
};

export const buttonSizes = {
  lg: 48,
  md: 40,
  sm: 32,
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

export const defaultHeaderTitleContainerStyle: ViewStyle = {
  width: Platform.OS === 'ios' ? '65%' : '90%',
  alignItems: Platform.OS === 'ios' ? 'center' : 'flex-start',
};
