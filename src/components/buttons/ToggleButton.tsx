import React, { useMemo, useState } from 'react';
import { ColorValue, StyleProp, TextStyle, ViewStyle } from 'react-native';

import { CommonButtonProps } from './buttonStyles';
import Button from './Button';

type ToggleButtonStateProp<T> = (currentToggleState: boolean) => T;

export type ToggleButtonProps = Pick<
  CommonButtonProps,
  'size' | 'type' | 'disabled'
> & {
  initialState?: boolean;
  title: ToggleButtonStateProp<string>;
  underlayColor?: ToggleButtonStateProp<ColorValue | undefined>;
  loadingIndicatorColor?: ToggleButtonStateProp<ColorValue | undefined>;
  containerStyle?: ToggleButtonStateProp<StyleProp<ViewStyle>>;
  textStyle?: ToggleButtonStateProp<StyleProp<TextStyle>>;
  /**
   * The function to invoke when the toggle button is pressed.
   *
   * This function will be passed the new toggled state and will await for its
   * completion if required. To signify an error (and thus toggle the button
   * back to the previous state), throw an error inside this function.
   */
  onPress?: (newToggleState: boolean) => void | Promise<void>;
};

export default function ToggleButton(props: ToggleButtonProps) {
  const $FUNC = '[ToggleButton]';

  const {
    initialState = false,
    title: makeTitle,
    underlayColor: makeUnderlayColor,
    loadingIndicatorColor: makeLoadingIndicatorColor,
    containerStyle: makeContainerStyle,
    textStyle: makeTextStyle,
    onPress,
    ...restProps
  } = props;

  const [toggleState, setToggleState] = useState(initialState);
  const [isLoading, setIsLoading] = useState(false);

  const buttonProps = useMemo(() => {
    return {
      title: makeTitle(toggleState),
      underlayColor: makeUnderlayColor?.(toggleState),
      loadingIndicatorColor: makeLoadingIndicatorColor?.(toggleState),
      containerStyle: makeContainerStyle?.(toggleState),
      textStyle: makeTextStyle?.(toggleState),
    };
  }, [
    toggleState,
    makeTitle,
    makeUnderlayColor,
    makeLoadingIndicatorColor,
    makeContainerStyle,
    makeTextStyle,
  ]);

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
      {...buttonProps}
      loading={isLoading}
      variant={toggleState ? 'contained' : 'outlined'}
      onPress={handleOnPress}
    />
  );
}
