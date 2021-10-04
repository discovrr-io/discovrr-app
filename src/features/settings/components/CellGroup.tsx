import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { color, font, layout } from 'src/constants';
import { disabledDarkTextColor } from 'src/constants/color';
import { useCellElementContext } from './hooks';

import {
  CellElementContext,
  CellElementProps,
  renderChildrenWithDivider,
} from './common';

export const CELL_GROUP_VERTICAL_SPACING = layout.spacing.md;

type CellGroupProps = CellElementProps & {
  label: string;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export default function CellGroup(props: CellGroupProps) {
  const cellElementOptions = useCellElementContext(props.elementOptions);

  return (
    <CellElementContext.Provider value={cellElementOptions}>
      <Text
        style={[
          font.smallBold,
          styles.label,
          cellElementOptions.disabled && { color: disabledDarkTextColor },
          props.labelStyle,
        ]}>
        {props.label}
      </Text>
      <View
        style={[
          styles.contentContainer,
          {
            borderWidth: cellElementOptions.borderWidth,
            borderColor: cellElementOptions.borderColor,
          },
          props.containerStyle,
        ]}>
        {renderChildrenWithDivider(props.children, cellElementOptions)}
      </View>
    </CellElementContext.Provider>
  );
}

const styles = StyleSheet.create({
  label: {
    color: color.gray700,
    fontVariant: ['small-caps'],
    paddingLeft: layout.defaultScreenMargins.horizontal,
    paddingBottom: CELL_GROUP_VERTICAL_SPACING,
  },
  contentContainer: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: layout.radius.md,
  },
});
