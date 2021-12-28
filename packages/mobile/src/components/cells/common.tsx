import * as React from 'react';
import { StyleProp, StyleSheet, TextStyle, View } from 'react-native';
import { useTheme } from '@react-navigation/native';

import { color, font, layout } from 'src/constants';

export const CELL_ICON_SIZE = 20;
export const CELL_CONTENT_ELEMENT_SPACING = layout.spacing.md;

export const CELL_CONTAINER_SPACING_VERTICAL = layout.spacing.md * 1.5;
export const CELL_CONTAINER_SPACING_HORIZONTAL = layout.spacing.md * 1.5;
export const CELL_CONTAINER_BORDER_WIDTH = StyleSheet.hairlineWidth;

export type CellElementProps = {
  elementOptions?: Partial<CellElementOptions>;
};

export type CellElementOptions = {
  disabled: boolean;
  labelStyle: StyleProp<TextStyle>;
  captionStyle: StyleProp<TextStyle>;
  iconSize: number;
  itemSpacing: number;
  borderWidth: number;
  containerSpacingVertical: number;
  containerSpacingHorizontal: number;
};

const styles = StyleSheet.create({
  defaultLabelStyle: font.body,
  defaultCaptionStyle: {
    ...font.small,
    color: color.gray500,
    paddingTop: layout.spacing.xs,
  },
  defaultContainerStyle: {
    paddingHorizontal: CELL_CONTAINER_SPACING_HORIZONTAL,
    paddingVertical: CELL_CONTAINER_SPACING_VERTICAL,
    borderWidth: CELL_CONTAINER_BORDER_WIDTH,
  },
});

export const defaultCellElementOptions: CellElementOptions = {
  disabled: false,
  iconSize: CELL_ICON_SIZE,
  itemSpacing: CELL_CONTENT_ELEMENT_SPACING,
  labelStyle: styles.defaultLabelStyle,
  captionStyle: styles.defaultCaptionStyle,
  borderWidth: CELL_CONTAINER_BORDER_WIDTH,
  containerSpacingHorizontal: CELL_CONTAINER_SPACING_HORIZONTAL,
  containerSpacingVertical: CELL_CONTAINER_SPACING_VERTICAL,
};

export const CellElementContext = React.createContext<CellElementOptions>(
  defaultCellElementOptions,
);

export function renderChildrenWithDivider(
  children: React.ReactNode,
  cellElementOptions: CellElementOptions,
) {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors } = useTheme();
  return React.Children.toArray(children)
    .filter(Boolean)
    .map((child, index, array) => (
      <View key={`cell-child-${index}`}>
        {child}
        {index < array.length - 1 && (
          <View
            style={{
              width: '94%',
              alignSelf: 'center',
              borderBottomWidth: cellElementOptions.borderWidth,
              borderColor: colors.border,
            }}
          />
        )}
      </View>
    ));
}
