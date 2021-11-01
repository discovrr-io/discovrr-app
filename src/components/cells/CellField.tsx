import * as React from 'react';
import {
  LayoutChangeEvent,
  TextInput,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import * as constants from 'src/constants';
import CellContainer from './CellContainer';
import { CellElementProps } from './common';
import { useCellElementContext } from './hooks';

const PLACEHOLDER_SCALE = 0.7;

interface CellFieldMethods {
  isFocused: boolean;
  focus: () => void;
  blur: () => void;
  clear: () => void;
}

interface CellFieldProps extends CellElementProps, TextInputProps {
  label: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  error?: string | undefined;
}

export const CellField = React.forwardRef<CellFieldMethods, CellFieldProps>(
  (props, ref) => {
    const {
      label,
      prefix,
      suffix,
      error,
      multiline,
      placeholder,
      placeholderTextColor,
      style,
      value: _initialValue = '',
      ...textInputProps
    } = props;

    const cellElementOptions = useCellElementContext(props.elementOptions);
    const spacingTop = cellElementOptions.containerSpacingVertical * 1.9;
    const spacingBottom = cellElementOptions.containerSpacingVertical;

    const [value, setValue] = React.useState(_initialValue);
    const textInputRef = React.useRef<TextInput>(null);

    const labelState = useSharedValue(_initialValue ? 1 : 0);
    const labelWidth = useSharedValue(0);

    const labelStyles = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            labelState.value,
            [0, 1],
            [0, -(spacingTop * 0.6)],
          ),
        },
        {
          scale: interpolate(labelState.value, [0, 1], [1, PLACEHOLDER_SCALE]),
        },
        {
          translateX: interpolate(
            labelState.value,
            [0, 1],
            [
              0,
              -1 *
                ((labelWidth.value - labelWidth.value * PLACEHOLDER_SCALE) / 2 +
                  24.0),
            ],
          ),
        },
      ],
    }));

    const placeholderStyles = useAnimatedStyle(
      () => ({
        opacity:
          value.length > 0
            ? 0
            : interpolate(labelState.value, [0.25, 0.75], [0, 1]),
      }),
      [value],
    );

    const handleTextInputFocus = () => {
      labelState.value = withTiming(1);
      textInputRef.current?.focus();
    };

    const handleTextInputBlur = () => {
      if (value.length === 0) labelState.value = withTiming(0);
      textInputRef.current?.blur();
    };

    const handleTextInputClear = () => {
      textInputRef.current?.clear();
    };

    const handlePlaceholderContainerLayout = React.useCallback(
      ({ nativeEvent }: LayoutChangeEvent) => {
        labelWidth.value = nativeEvent.layout.width;
      },
      [labelWidth],
    );

    React.useImperativeHandle(ref, () => ({
      isFocused: Boolean(textInputRef.current?.isFocused),
      focus: handleTextInputFocus,
      blur: handleTextInputBlur,
      clear: handleTextInputClear,
    }));

    return (
      <CellContainer
        elementOptions={{
          ...props.elementOptions,
          containerSpacingVertical: 0,
        }}
        style={[multiline && { minHeight: 120 }]}>
        <Animated.View
          pointerEvents="none"
          style={[
            placeholderStyles,
            {
              position: 'absolute',
              top: spacingTop,
              left: cellElementOptions.containerSpacingHorizontal,
              right: cellElementOptions.containerSpacingHorizontal,
            },
          ]}>
          <Animated.Text
            numberOfLines={1}
            style={[
              constants.font.medium,
              style,
              { color: placeholderTextColor ?? constants.color.gray300 },
            ]}>
            {placeholder}
          </Animated.Text>
        </Animated.View>
        <TouchableWithoutFeedback onPress={handleTextInputFocus}>
          <View style={{ flex: 1 }}>
            <TextInput
              {...textInputProps}
              ref={textInputRef}
              placeholder=""
              pointerEvents={
                textInputRef.current?.isFocused() ? 'auto' : 'none'
              }
              multiline={multiline}
              value={value}
              onChangeText={setValue}
              onFocus={handleTextInputFocus}
              onBlur={handleTextInputBlur}
              style={[
                constants.font.medium,
                {
                  flex: 1,
                  textAlignVertical: 'top',
                  paddingTop: spacingTop,
                  paddingBottom: spacingBottom,
                },
                style,
              ]}
            />
          </View>
        </TouchableWithoutFeedback>
        <Animated.View
          pointerEvents="none"
          onLayout={handlePlaceholderContainerLayout}
          style={[
            labelStyles,
            {
              position: 'absolute',
              top: spacingTop * 0.75,
              left: cellElementOptions.containerSpacingHorizontal,
              right: cellElementOptions.containerSpacingHorizontal,
            },
          ]}>
          <Animated.Text
            numberOfLines={1}
            style={[
              constants.font.medium,
              style,
              { color: placeholderTextColor ?? constants.color.gray500 },
            ]}>
            {label}
          </Animated.Text>
        </Animated.View>
      </CellContainer>
    );
  },
);

export default CellField;
