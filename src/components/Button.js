import React from 'react';
// import PropTypes from 'prop-types';
import { StyleSheet } from 'react-native';
import { Text, TouchableHighlight } from 'react-native';

import { colors, typography, values } from '../constants';

const Button = ({
  title,
  primary = false,
  size = 'big',
  disabled = false,
  onPress = () => {},
  ...props
}) => {
  const stateStyle = primary ? primaryStyle : secondaryStyle;
  const currentStyle = disabled ? stateStyle.disabled : stateStyle.default;

  const isBig = size === 'big';
  const sizeStyle = isBig ? bigStyle : smallStyle;

  return (
    <TouchableHighlight
      disabled={disabled}
      underlayColor={primary ? colors.accentFocused : colors.lightGray}
      onPress={onPress}
      style={[currentStyle, sizeStyle, props.style]}>
      <Text style={isBig ? stateStyle.text : stateStyle.textSmall}>
        {title}
      </Text>
    </TouchableHighlight>
  );
};

// Button.propTypes = {
//   title: PropTypes.string.isRequired,
//   primary: PropTypes.bool,
//   disabled: PropTypes.bool,
//   onPress: PropTypes.func,
// };

const buttonStyles = {
  alignItems: 'center',
  borderWidth: values.border.thin,
  justifyContent: 'center',
};

const smallStyle = {
  height: 28,
  borderRadius: values.radius.md,
  padding: values.spacing.sm,
};

const bigStyle = {
  height: 50,
  borderRadius: values.radius.lg,

  padding: values.spacing.md,
};

const textStyle = {
  fontWeight: '700',
};

const bigTextStyle = {
  ...textStyle,
  fontSize: typography.size.lg,
};

const smallTextStyle = {
  ...textStyle,
  fontSize: typography.size.sm,
};

const primaryStyle = StyleSheet.create({
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

const secondaryStyle = StyleSheet.create({
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
    borderColor: colors.lightGray,
  },
});

export default Button;
