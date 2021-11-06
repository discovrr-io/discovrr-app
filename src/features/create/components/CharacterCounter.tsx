import * as React from 'react';
import { StyleProp, TextStyle } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { color, font } from 'src/constants';

type CharacterCounterProps = {
  currentLength: number;
  maxLength: number;
  style?: StyleProp<TextStyle>;
};

export default function CharacterCounter(props: CharacterCounterProps) {
  const { currentLength, maxLength, style } = props;

  const characterCountColor = useDerivedValue(() => {
    if (currentLength < maxLength - 50) {
      return withTiming(0.0);
    } else if (currentLength < maxLength - 10) {
      return withTiming(0.5);
    } else {
      return withTiming(1.0);
    }
  }, [currentLength]);

  const characterCountStyle = useAnimatedStyle(
    () => ({
      color: interpolateColor(
        characterCountColor.value,
        [0, 0.5, 1],
        [color.gray500, color.yellow500, color.red500],
      ),
    }),
    [],
  );

  return (
    <Animated.Text style={[characterCountStyle, font.smallBold, style]}>
      {currentLength}/{maxLength}
    </Animated.Text>
  );
}
