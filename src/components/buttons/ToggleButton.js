import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Text, TouchableHighlight } from 'react-native';

import { colors } from '../../constants';
import styles from './styles';

/* // TODO: For some reason this doesn't work:
import Button from './Button';

const ToggleButton = ({
  titles,
  initialState = false,
  onPress = () => {},
  ...props
}) => {
  const [toggleState, setToggleState] = useState(initialState);

  return (
    <Button
      primary={toggleState}
      onPress={() => {
        setToggleState(!toggleState);
        onPress && onPress();
      }}
      {...props}
    />
  );
};
*/

const ToggleButton = ({
  titles,
  initialState = false,
  size = 'big',
  disabled = false,
  transparent = false,
  onPress = () => {},
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
      underlayColor={toggleState ? colors.accentFocused : colors.lightGray}
      onPress={() => {
        setToggleState(!toggleState);
        onPress();
      }}
      style={[currentStyle, sizeStyle, props.style]}>
      <Text style={isBig ? stateStyle.text : stateStyle.textSmall}>
        {title}
      </Text>
    </TouchableHighlight>
  );
};

ToggleButton.propTypes = {
  titles: PropTypes.shape({
    on: PropTypes.string.isRequired,
    off: PropTypes.string.isRequired,
  }).isRequired,
  initialState: PropTypes.bool,
  onPress: PropTypes.func,
  size: PropTypes.oneOf(['big', 'small']),
  disabled: PropTypes.bool,
};

export default ToggleButton;
