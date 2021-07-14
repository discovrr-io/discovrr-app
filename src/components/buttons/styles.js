import { StyleSheet } from 'react-native';
import { colors, typography, values } from '../../constants';

export const buttonStyles = {
  alignItems: 'center',
  borderWidth: values.border.thin,
  justifyContent: 'center',
};

export const smallStyle = {
  height: values.buttonSizes.sm,
  borderRadius: values.radius.sm,
  padding: values.spacing.sm,
};

export const bigStyle = {
  height: values.buttonSizes.lg,
  borderRadius: values.radius.lg,
  padding: values.spacing.md,
};

export const textStyle = {
  fontWeight: '700',
};

export const bigTextStyle = {
  ...textStyle,
  fontSize: typography.size.lg,
};

export const smallTextStyle = {
  ...textStyle,
  fontSize: typography.size.sm,
};

export const primaryStyle = StyleSheet.create({
  text: {
    ...bigTextStyle,
    color: colors.white,
  },
  textSmall: {
    ...smallTextStyle,
    color: colors.white,
  },
  default: {
    ...buttonStyles,
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  disabled: {
    ...buttonStyles,
    backgroundColor: colors.accentDisabled,
    borderColor: colors.accentDisabled,
  },
});

export const secondaryStyle = StyleSheet.create({
  text: {
    ...bigTextStyle,
    color: colors.gray,
  },
  textSmall: {
    ...smallTextStyle,
    color: colors.gray,
  },
  default: {
    ...buttonStyles,
    backgroundColor: colors.white,
    borderColor: colors.gray,
  },
  disabled: {
    ...buttonStyles,
    backgroundColor: colors.white,
    borderColor: colors.gray300,
  },
});

export const transparentStyle = StyleSheet.create({
  text: {
    ...bigTextStyle,
    color: colors.white,
  },
  textSmall: {
    ...smallTextStyle,
    color: colors.white,
  },
  default: {
    ...buttonStyles,
    backgroundColor: 'transparent',
    borderColor: colors.white,
  },
  disabled: {
    ...buttonStyles,
    backgroundColor: 'transparent',
    borderColor: colors.gray300,
  },
});
