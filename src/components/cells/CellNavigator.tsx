import React from 'react';
import { useNavigation } from '@react-navigation/core';

import { SettingsStackNavigationProp } from 'src/navigation';
import CellButton, { CellButtonProps } from './CellButton';

type CellNavigatorProps = Omit<
  CellButtonProps,
  'suffixIconName' | 'onPress'
> & {
  onPress?: (navigation: SettingsStackNavigationProp) => void | Promise<void>;
};

export default function CellNavigator(props: CellNavigatorProps) {
  const navigation = useNavigation<SettingsStackNavigationProp>();
  return (
    <CellButton
      {...props}
      suffixIconName="chevron-forward-outline"
      onPress={() => props.onPress?.(navigation)}
    />
  );
}
