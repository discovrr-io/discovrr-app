import * as React from 'react';
import {
  LayoutChangeEvent,
  Text,
  TextInput,
  TextInputProps,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
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

export interface CellFieldProps extends CellElementProps, TextInputProps {
  label: string;
  error?: string | undefined;
  // prefix?: React.ReactNode;
  // suffix?: React.ReactNode;
}

export const CellField = React.forwardRef<CellFieldMethods, CellFieldProps>(
  (props, ref) => {
    const {
      label,
      error,
      multiline,
      placeholder,
      placeholderTextColor,
      style,
      value = '',
      onChangeText,
      ...textInputProps
    } = props;

    const cellElementOptions = useCellElementContext(props.elementOptions);
    const spacingTop = cellElementOptions.containerSpacingVertical * 1.9;
    const spacingBottom = cellElementOptions.containerSpacingVertical;

    const [text, setText] = React.useState(value);
    const textInputRef = React.useRef<TextInput>(null);

    const labelState = useSharedValue(value ? 1 : 0);
    const labelWidth = useSharedValue(0);
    const errorState = useDerivedValue(() => {
      return error ? withTiming(1) : withTiming(0);
    }, [error]);

    const blur = () => textInputRef.current?.blur();
    const focus = () => textInputRef.current?.focus();
    const clear = () => textInputRef.current?.clear();
    const isFocused = () => Boolean(textInputRef.current?.isFocused());

    const labelTransformStyles = useAnimatedStyle(() => ({
      transform: [
        {
          translateY: interpolate(
            labelState.value,
            [0, 1],
            [0, -(spacingTop * 0.6)],
          ),
        },
        {
          translateX: interpolate(
            labelState.value,
            [0, 1],
            [
              0,
              -((labelWidth.value - labelWidth.value * PLACEHOLDER_SCALE) / 2),
            ],
          ),
        },
        {
          scale: interpolate(labelState.value, [0, 1], [1, PLACEHOLDER_SCALE]),
        },
      ],
    }));

    const labelColorStyles = useAnimatedStyle(() => ({
      color: interpolateColor(
        errorState.value,
        [0, 1],
        [
          placeholderTextColor?.toString() ?? constants.color.gray500,
          constants.color.danger,
        ],
      ),
    }));

    const placeholderStyles = useAnimatedStyle(
      () => ({
        opacity:
          value.length !== 0
            ? 0
            : interpolate(labelState.value, [0.25, 0.75], [0, 1]),
      }),
      [value],
    );

    const handleChangeText = (text: string) => {
      onChangeText?.(text);
      setText(text);
    };

    const handleFocus = () => {
      labelState.value = withTiming(1);
      focus();
    };

    const handleBlur = () => {
      if (value.length === 0) labelState.value = withTiming(0);
      blur();
    };

    const handleClear = () => {
      setText('');
      clear();
    };

    const handlePlaceholderContainerLayout = React.useCallback(
      ({ nativeEvent }: LayoutChangeEvent) => {
        labelWidth.value = nativeEvent.layout.width;
      },
      [labelWidth],
    );

    React.useImperativeHandle(ref, () => ({
      isFocused: isFocused(),
      focus: handleFocus,
      blur: handleBlur,
      clear: handleClear,
    }));

    return (
      <>
        <CellContainer
          elementOptions={{
            ...props.elementOptions,
            containerSpacingVertical: 0,
          }}
          style={[multiline && { minHeight: 150, maxHeight: 400 }]}>
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
          <TouchableWithoutFeedback onPress={handleFocus}>
            <View style={{ flex: 1 }}>
              <TextInput
                {...textInputProps}
                ref={textInputRef}
                placeholder=""
                pointerEvents={isFocused() ? 'auto' : 'none'}
                multiline={multiline}
                value={text}
                onChangeText={handleChangeText}
                onFocus={handleFocus}
                onBlur={handleBlur}
                textAlign="left"
                style={[
                  constants.font.medium,
                  {
                    flex: 1,
                    textAlignVertical: 'top',
                    paddingTop: spacingTop,
                    paddingBottom: !error ? spacingBottom : undefined,
                    paddingLeft: -1, // Android needs this
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
              labelTransformStyles,
              {
                position: 'absolute',
                top: spacingTop * 0.75,
                left: cellElementOptions.containerSpacingHorizontal,
              },
            ]}>
            <Animated.Text
              numberOfLines={1}
              style={[constants.font.medium, style, labelColorStyles]}>
              {label}
            </Animated.Text>
          </Animated.View>
        </CellContainer>
        {error && (
          <TouchableWithoutFeedback onPress={handleFocus}>
            <View
              style={{
                paddingTop: constants.layout.spacing.sm,
                paddingBottom: spacingBottom,
                paddingHorizontal:
                  cellElementOptions.containerSpacingHorizontal,
              }}>
              <Text
                style={[
                  constants.font.smallBold,
                  { color: constants.color.danger },
                ]}>
                {error}
              </Text>
            </View>
          </TouchableWithoutFeedback>
        )}
      </>
    );
  },
);

export default CellField;
