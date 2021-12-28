import * as React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import Icon from 'react-native-vector-icons/Ionicons';

import * as constants from 'src/constants';

const PLAY_BUTTON_SIZE_SMALL = 80;
const PLAY_BUTTON_SIZE_LARGE = 120;
const PLAY_BUTTON_COLOR = constants.color.gray100;

type PlayButtonProps = {
  smallContent?: boolean;
  style?: StyleProp<Animated.AnimateStyle<ViewStyle>>;
};

export default function PlayButton(props: PlayButtonProps) {
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: '100%',
          height: '100%',
          backgroundColor: '#00000044',
          alignItems: 'center',
          justifyContent: 'center',
        },
        props.style,
      ]}>
      <Icon
        name="play"
        size={
          props.smallContent ? PLAY_BUTTON_SIZE_SMALL : PLAY_BUTTON_SIZE_LARGE
        }
        color={PLAY_BUTTON_COLOR}
      />
    </Animated.View>
  );
}
