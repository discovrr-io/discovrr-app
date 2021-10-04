import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

type SpacerProps = {
  horizontal?: number;
  vertical?: number;
  style?: StyleProp<ViewStyle>;
};

const Spacer = (props: SpacerProps) => {
  return (
    <View
      style={[
        // (props.horizontal ?? -1 >= 0) || (props.vertical ?? -1 >= 0)
        //   ? {
        //       width: props.horizontal,
        //       height: props.vertical,
        //     }
        //   : {
        //       flexGrow: 1,
        //       flexShrink: 1,
        //     },
        !!props.horizontal && {
          width: props.horizontal,
          height: '100%',
          // backgroundColor: 'lightgreen',
        },
        !!props.vertical && {
          height: props.vertical,
          width: '100%',
          // backgroundColor: 'lightblue',
        },
        props.style,
      ]}
    />
  );
};

type SpacerVerticalProps = {
  value: NonNullable<SpacerProps['vertical']>;
  style?: SpacerProps['style'];
};

Spacer.Vertical = (props: SpacerVerticalProps) => (
  <Spacer horizontal={0} vertical={props.value} style={props.style} />
);

type SpacerHorizontalProps = {
  value: NonNullable<SpacerProps['horizontal']>;
  style?: SpacerProps['style'];
};

Spacer.Horizontal = (props: SpacerHorizontalProps) => (
  <Spacer horizontal={props.value} vertical={0} style={props.style} />
);

export default Spacer;
