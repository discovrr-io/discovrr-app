import * as React from 'react';
import {
  LayoutChangeEvent,
  Platform,
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
import { useExtendedTheme } from 'src/hooks';

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
      value: initialValue = '',
      onChangeText,
      ...textInputProps
    } = props;

    const cellElementOptions = useCellElementContext(props.elementOptions);
    const spacingTop = cellElementOptions.containerSpacingVertical * 1.9;
    const spacingBottom = cellElementOptions.containerSpacingVertical;

    const { colors } = useExtendedTheme();

    const [text, setText] = React.useState(initialValue);
    const textInputRef = React.useRef<TextInput>(null);

    const labelState = useSharedValue(text ? 1 : 0);
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
            [0, -(spacingTop * 0.55)],
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

    const placeholderStyles = useAnimatedStyle(() => ({
      opacity: interpolate(labelState.value, [0.25, 0.75], [0, 1]),
    }));

    const handleChangeText = (text: string) => {
      onChangeText?.(text);
      setText(text);
    };

    const handleFocus = () => {
      labelState.value = withTiming(1);
      focus();
    };

    const handleBlur = () => {
      if (text.length === 0) labelState.value = withTiming(0);
      blur();
    };

    const handleClear = () => {
      setText('');
      clear();
    };

    const handleLabelViewLayout = React.useCallback(
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
          style={[multiline && { height: 200 }]}>
          <TouchableWithoutFeedback onPress={handleFocus}>
            <Animated.View style={[placeholderStyles, { flex: 1 }]}>
              <TextInput
                {...textInputProps}
                ref={textInputRef}
                pointerEvents={isFocused() ? 'auto' : 'none'}
                multiline={multiline}
                placeholder={placeholder}
                placeholderTextColor={
                  placeholderTextColor ?? colors.captionDisabled
                }
                value={text}
                onChangeText={handleChangeText}
                onFocus={e => {
                  handleFocus();
                  textInputProps.onFocus?.(e);
                }}
                onBlur={e => {
                  handleBlur();
                  textInputProps.onBlur?.(e);
                }}
                textAlign="left"
                selectionColor={Platform.select({
                  ios: constants.color.accent,
                })}
                style={[
                  constants.font.medium,
                  {
                    flex: 1,
                    color: colors.text,
                    textAlignVertical: 'top',
                    paddingTop: spacingTop,
                    paddingBottom: Platform.select({
                      ios: !error ? spacingBottom : undefined,
                      android: constants.layout.spacing.xs,
                    }),
                    paddingLeft: Platform.select({
                      android: -1,
                    }),
                  },
                  style,
                ]}
              />
            </Animated.View>
          </TouchableWithoutFeedback>
          <Animated.View
            pointerEvents="none"
            onLayout={handleLabelViewLayout}
            style={[
              labelTransformStyles,
              {
                position: 'absolute',
                top: spacingTop * 0.75,
                left: cellElementOptions.containerSpacingHorizontal,
                right: cellElementOptions.containerSpacingHorizontal,
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
