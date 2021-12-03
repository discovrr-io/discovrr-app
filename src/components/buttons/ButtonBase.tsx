import * as React from 'react';
import {
  ActivityIndicator,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import Spacer from '../Spacer';
import { CommonButtonProps, ButtonStyles } from './buttonStyles';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';
import { useExtendedTheme } from 'src/hooks';

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
    icon,
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

  const { colors } = useExtendedTheme();

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
          color={
            loadingIndicatorColor ??
            buttonStyles?.defaultTitle.color ??
            colors.text
          }
        />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon && (
            <>
              <Icon
                name={icon}
                size={22}
                color={
                  disabled
                    ? buttonStyles?.disabledTitle.color ?? colors.textDisabled
                    : buttonStyles?.defaultTitle.color ?? colors.text
                }
              />
              <Spacer.Horizontal value="md" />
            </>
          )}
          <Text
            {...innerTextProps}
            testID={'btn-text'}
            style={[
              disabled
                ? buttonStyles?.disabledTitle
                : buttonStyles?.defaultTitle,
              textStyle,
            ]}>
            {title}
          </Text>
        </View>
      )}
    </Touchable>
  );
}
