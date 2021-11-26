import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';

import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';
import { useCellElementContext } from './hooks';

import {
  CellElementContext,
  CellElementProps,
  renderChildrenWithDivider,
} from './common';

export const CELL_GROUP_VERTICAL_SPACING = constants.layout.spacing.md;

export type CellGroupProps = CellElementProps & {
  label?: string;
  labelStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

export default function CellGroup(props: CellGroupProps) {
  const cellElementOptions = useCellElementContext(props.elementOptions);
  const { colors } = useExtendedTheme();

  return (
    <CellElementContext.Provider value={cellElementOptions}>
      {props.label && (
        <Text
          style={[
            constants.font.smallBold,
            styles.label,
            {
              color: cellElementOptions.disabled
                ? colors.captionDisabled
                : colors.caption,
            },
            props.labelStyle,
          ]}>
          {props.label}
        </Text>
      )}
      <View
        style={[
          styles.contentContainer,
          {
            backgroundColor: cellElementOptions.disabled
              ? colors.background
              : colors.card,
          },
          {
            borderWidth: cellElementOptions.borderWidth,
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
    paddingLeft: constants.layout.defaultScreenMargins.horizontal,
    paddingBottom: CELL_GROUP_VERTICAL_SPACING,
  },
  contentContainer: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: constants.layout.radius.md,
  },
});
