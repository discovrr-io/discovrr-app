import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import { useTheme } from '@react-navigation/native';

import { color, font, layout } from 'src/constants';
import { useCellElementContext } from './hooks';

import {
  disabledDarkTextColor,
  disabledLightTextColor,
} from 'src/constants/color';

import {
  CellElementContext,
  CellElementProps,
  renderChildrenWithDivider,
} from './common';

export const CELL_GROUP_VERTICAL_SPACING = layout.spacing.md;

export type CellGroupProps = CellElementProps & {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export default function CellGroup(props: CellGroupProps) {
  const cellElementOptions = useCellElementContext(props.elementOptions);
  const { dark, colors } = useTheme();
  return (
    <CellElementContext.Provider value={cellElementOptions}>
      {props.label && (
        <Text
          style={[
            font.smallBold,
            styles.label,
            { color: dark ? color.gray500 : color.gray700 },
            cellElementOptions.disabled && {
              color: dark ? disabledLightTextColor : disabledDarkTextColor,
            },
            props.labelStyle,
          ]}>
          {props.label}
        </Text>
      )}
      <View
        style={[
          styles.contentContainer,
          { backgroundColor: colors.card },
          // cellElementOptions.disabled && { backgroundColor: color.white },
          {
            borderWidth: cellElementOptions.borderWidth,
            // borderColor: cellElementOptions.borderColor,
            borderColor: colors.border,
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
    fontVariant: ['small-caps'],
    paddingLeft: layout.defaultScreenMargins.horizontal,
    paddingBottom: CELL_GROUP_VERTICAL_SPACING,
  },
  contentContainer: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: layout.radius.md,
    // backgroundColor: color.absoluteWhite,
  },
});
