import React from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableHighlight } from 'react-native';

import { colors } from '../constants';
import styles from './styles';

const Button = ({
  title,
  primary = false,
  size = 'big',
  disabled = false,
  transparent = false,
  onPress = () => {},
  ...props
}) => {
  const stateStyle = primary
    ? styles.primaryStyle
    : transparent
    ? styles.transparentStyle
    : styles.secondaryStyle;
  const currentStyle = disabled ? stateStyle.disabled : stateStyle.default;

  const isBig = size === 'big';
  const sizeStyle = isBig ? styles.bigStyle : styles.smallStyle;

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

Button.propTypes = {
  title: PropTypes.string.isRequired,
  primary: PropTypes.bool,
  size: PropTypes.oneOf(['big', 'small']),
  disabled: PropTypes.bool,
  transparent: PropTypes.bool,
  onPress: PropTypes.func,
};

export default Button;
