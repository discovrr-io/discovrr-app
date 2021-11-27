import * as React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableHighlight,
  TouchableOpacity,
} from 'react-native';

import { color } from 'src/constants';
import { CommonButtonProps, ButtonStyles } from './buttonStyles';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';

export enum ButtonBaseTestId {
  ACTIVITY_INDICATOR = 'btn-activity-indicator',
  CONTAINER = 'btn-container',
  TEXT = 'btn-text',
}

type ButtonBaseProps = CommonButtonProps & {
  buttonStyles?: ButtonStyles;
  useTouchableOpacity?: boolean;
};

export default function ButtonBase(props: ButtonBaseProps) {
  const {
    title,
    disabled,
    loading,
    buttonStyles,
    underlayColor,
    loadingIndicatorColor,
    containerStyle,
    textStyle,
    useTouchableOpacity,
    innerTextProps,
    ...restProps
  } = props;

  const Touchable = useTouchableOpacity ? TouchableOpacity : TouchableHighlight;

  return (
    // @ts-ignore Touchable is valid here
    <Touchable
      {...restProps}
      testID={'btn-container'}
      disabled={disabled || loading}
      activeOpacity={DEFAULT_ACTIVE_OPACITY}
      underlayColor={underlayColor}
      style={[
        disabled
          ? buttonStyles?.disabledContainer
          : buttonStyles?.defaultContainer,
        containerStyle,
      ]}>
      {loading ? (
        <ActivityIndicator
          testID={'btn-activity-indicator'}
          size="small"
          color={loadingIndicatorColor ?? color.accent}
        />
      ) : (
        <Text
          {...innerTextProps}
          testID={'btn-text'}
          style={[
            disabled ? buttonStyles?.disabledTitle : buttonStyles?.defaultTitle,
            textStyle,
          ]}>
          {title}
        </Text>
      )}
    </Touchable>
  );
}
