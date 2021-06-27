import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ActivityIndicator, Text, TouchableHighlight } from 'react-native';

import { colors } from '../../constants';
import * as styles from './styles';

const ToggleButton = ({
  titles,
  initialState = false,
  size = 'big',
  disabled = false,
  transparent = false,
  isLoading = false,
  onPress = (_) => {},
  ...props
}) => {
  const [toggleState, setToggleState] = useState(initialState);

  const stateStyle = toggleState
    ? styles.primaryStyle
    : transparent
    ? styles.transparentStyle
    : styles.secondaryStyle;
  const currentStyle = disabled ? stateStyle.disabled : stateStyle.default;

  const isBig = size === 'big';
  const sizeStyle = isBig ? styles.bigStyle : styles.smallStyle;

  const title = toggleState ? titles.on : titles.off;

  return (
    <TouchableHighlight
      disabled={disabled}
      underlayColor={toggleState ? colors.accentFocused : colors.gray300}
      onPress={() => {
        setToggleState(!toggleState);
        const value = onPress(!toggleState);
        if (typeof value === 'boolean') setToggleState(value);
      }}
      style={[currentStyle, sizeStyle, props.style]}>
      {isLoading ? (
        <ActivityIndicator color={colors.white} size="small" />
      ) : (
        <Text style={isBig ? stateStyle.text : stateStyle.textSmall}>
          {title}
        </Text>
      )}
    </TouchableHighlight>
  );
};

ToggleButton.propTypes = {
  titles: PropTypes.shape({
    on: PropTypes.string.isRequired,
    off: PropTypes.string.isRequired,
  }).isRequired,
  initialState: PropTypes.bool,
  size: PropTypes.oneOf(['big', 'small']),
  disabled: PropTypes.bool,
  isLoading: PropTypes.bool,
  onPress: PropTypes.func,
};

ToggleButton.defaultProps = {
  initialState: false,
  size: 'big',
  disabled: false,
  transparent: false,
  isLoading: false,
  onPress: (_) => {},
};

export default ToggleButton;
