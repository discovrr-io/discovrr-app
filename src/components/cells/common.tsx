import React from 'react';
import { StyleProp, StyleSheet, TextStyle, View } from 'react-native';

import { color, font, layout } from 'src/constants';

export const CELL_HIGHLIGHT_COLOR = color.white;
export const CELL_ICON_SIZE = 20;
export const CELL_CONTENT_ELEMENT_SPACING = layout.spacing.md;

export const CELL_CONTAINER_SPACING_VERTICAL = layout.spacing.md * 1.5;
export const CELL_CONTAINER_SPACING_HORIZONTAL = layout.spacing.md * 1.5;
export const CELL_CONTAINER_BORDER_WIDTH = StyleSheet.hairlineWidth;
export const CELL_CONTAINER_BORDER_COLOR = color.gray200;

export type CellElementProps = {
  elementOptions?: Partial<CellElementOptions>;
};

export type CellElementOptions = {
  disabled: boolean;
  highlightColor: string;
  labelStyle: StyleProp<TextStyle>;
  captionStyle: StyleProp<TextStyle>;
  iconSize: number;
  itemSpacing: number;
  borderWidth: number;
  borderColor: string;
  containerSpacingVertical: number;
  containerSpacingHorizontal: number;
};

const styles = StyleSheet.create({
  defaultLabelStyle: font.medium,
  defaultCaptionStyle: {
    ...font.small,
    color: color.gray500,
    paddingTop: layout.spacing.xs,
  },
  defaultContainerStyle: {
    paddingHorizontal: CELL_CONTAINER_SPACING_HORIZONTAL,
    paddingVertical: CELL_CONTAINER_SPACING_VERTICAL,
    borderWidth: CELL_CONTAINER_BORDER_WIDTH,
    borderColor: CELL_CONTAINER_BORDER_COLOR,
  },
});

export const defaultCellElementOptions: CellElementOptions = {
  disabled: false,
  highlightColor: CELL_HIGHLIGHT_COLOR,
  iconSize: CELL_ICON_SIZE,
  itemSpacing: CELL_CONTENT_ELEMENT_SPACING,
  labelStyle: styles.defaultLabelStyle,
  captionStyle: styles.defaultCaptionStyle,
  borderWidth: CELL_CONTAINER_BORDER_WIDTH,
  borderColor: CELL_CONTAINER_BORDER_COLOR,
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
  return React.Children.map(children, (child, index) => (
    <>
      {child}
      {index < React.Children.count(children) - 1 && (
        <View
          style={{
            borderBottomWidth: cellElementOptions.borderWidth,
            borderColor: cellElementOptions.borderColor,
          }}
        />
      )}
    </>
  ));
}
