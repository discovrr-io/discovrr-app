import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { layout } from 'src/constants';
import { Spacing } from 'src/constants/layout';

type SpacerProps = {
  horizontal?: number | keyof Spacing;
  vertical?: number | keyof Spacing;
  style?: StyleProp<ViewStyle>;
};

const Spacer = (props: SpacerProps) => {
  let horizontalSpacing: number | undefined = undefined;
  let verticalSpacing: number | undefined = undefined;

  if (typeof props.horizontal === 'number') {
    horizontalSpacing = props.horizontal;
  } else if (props.horizontal) {
    horizontalSpacing = layout.spacing[props.horizontal];
  }

  if (typeof props.vertical === 'number') {
    verticalSpacing = props.vertical;
  } else if (props.vertical) {
    verticalSpacing = layout.spacing[props.vertical];
  }

  return (
    <View
      style={[
        !!horizontalSpacing && {
          width: horizontalSpacing,
          height: '100%',
        },
        !!verticalSpacing && {
          height: verticalSpacing,
          width: '100%',
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
