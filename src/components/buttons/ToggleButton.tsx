import React, { useState } from 'react';
import { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { CommonButtonProps } from './buttonStyles';
import Button from './Button';

export type ToggleButtonProps = Pick<
  CommonButtonProps,
  'size' | 'type' | 'disabled'
> & {
  titles: { on: string; off: string };
  initialState?: boolean;
  /**
   * The function to call when the toggle button is pressed.
   *
   * This function will be passed the new toggled state and will await for its
   * completion if required. To signify an error (and thus toggle the button
   * back to the previous state), throw an error inside this function.
   */
  onPress?: (newToggleState: boolean) => void | Promise<void>;
  containerStyle?: StyleProp<ViewStyle>;
  onStateUnderlayColor?: ColorValue | undefined;
  offStateUnderlayColor?: ColorValue | undefined;
  onStateLoadingIndicatorColor?: ColorValue | undefined;
  offStateLoadingIndicatorColor?: ColorValue | undefined;
  onStateStyle?: StyleProp<ViewStyle>;
  offStateStyle?: StyleProp<ViewStyle>;
  onStateTextStyle?: StyleProp<TextStyle>;
  offStateTextStyle?: StyleProp<TextStyle>;
};

export default function ToggleButton(props: ToggleButtonProps) {
  const $FUNC = '[ToggleButton]';

  const {
    titles,
    initialState = false,
    containerStyle,
    onStateUnderlayColor,
    offStateUnderlayColor,
    onStateLoadingIndicatorColor,
    offStateLoadingIndicatorColor,
    onStateStyle,
    offStateStyle,
    onStateTextStyle,
    offStateTextStyle,
    onPress,
    ...restProps
  } = props;

  const [toggleState, setToggleState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const handleOnPress = async () => {
    try {
      const newState = !toggleState;
      setIsLoading(true);
      await onPress?.(newState);
      setToggleState(newState);
    } catch (error) {
      console.warn($FUNC, `Toggling button back to ${toggleState}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      {...restProps}
      title={toggleState ? titles.on : titles.off}
      variant={toggleState ? 'contained' : 'outlined'}
      loading={isLoading}
      loadingIndicatorColor={
        toggleState
          ? onStateLoadingIndicatorColor
          : offStateLoadingIndicatorColor
      }
      underlayColor={toggleState ? onStateUnderlayColor : offStateUnderlayColor}
      onPress={handleOnPress}
      containerStyle={[
        containerStyle,
        toggleState ? onStateStyle : offStateStyle,
      ]}
      textStyle={[toggleState ? onStateTextStyle : offStateTextStyle]}
    />
  );
}
