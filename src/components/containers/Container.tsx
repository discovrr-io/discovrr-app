import React from 'react';
import {
  StyleProp,
  StyleSheet,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';

import { layout } from 'src/constants';

export type ContainerProps = Omit<ViewProps, 'style'> & {
  justifyContentToCenter?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

type InnerContainerProps = ContainerProps & {
  children?: React.ReactNode;
};

export default function Container(props: InnerContainerProps) {
  const {
    children,
    justifyContentToCenter = true,
    containerStyle,
    ...restProps
  } = props;

  return (
    <View
      {...restProps}
      style={[
        containerStyles.container,
        { justifyContent: justifyContentToCenter ? 'center' : 'flex-start' },
        containerStyle,
      ]}>
      {children}
    </View>
  );
}

const containerStyles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    paddingVertical: layout.spacing.lg,
    paddingHorizontal: layout.spacing.xxl,
  },
});
