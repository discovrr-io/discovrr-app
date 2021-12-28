import React from 'react';
import { useNavigation } from '@react-navigation/core';

import { RootStackNavigationProp } from 'src/navigation';
import CellButton, { CellButtonProps } from './CellButton';

export type CellNavigatorProps = Omit<
  CellButtonProps,
  'suffixIconName' | 'onPress'
> & {
  onPress?: (navigation: RootStackNavigationProp) => void | Promise<void>;
};

export default function CellNavigator(props: CellNavigatorProps) {
  const navigation = useNavigation<RootStackNavigationProp>();
  return (
    <CellButton
      {...props}
      suffixIconName="chevron-forward-outline"
      onPress={() => props.onPress?.(navigation)}
    />
  );
}
