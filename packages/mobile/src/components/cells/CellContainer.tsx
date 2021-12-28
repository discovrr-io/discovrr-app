import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { CellElementProps } from './common';
import { useCellElementContext } from './hooks';

type CellContainerProps = CellElementProps & {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function CellContainer(props: CellContainerProps) {
  const cellElementOptions = useCellElementContext(props.elementOptions);
  return (
    <View
      style={[
        styles.container,
        {
          paddingHorizontal: cellElementOptions.containerSpacingHorizontal,
          paddingVertical: cellElementOptions.containerSpacingVertical,
        },
        props.style,
      ]}>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
