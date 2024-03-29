import * as React from 'react';
import { Platform, Switch, SwitchProps, Text, View } from 'react-native';

import { color } from 'src/constants';
import { useExtendedTheme } from 'src/hooks';

import CellContainer from './CellContainer';
import { CellElementProps, defaultCellElementOptions } from './common';
import { useCellElementContext } from './hooks';

export type CellSwitchProps = CellElementProps &
  Pick<SwitchProps, 'disabled' | 'value' | 'onValueChange'> & {
    label: string;
    caption?: string;
  };

export default function CellSwitch(props: CellSwitchProps) {
  const cellElementOptions = useCellElementContext(props.elementOptions);
  const isDisabled = props.disabled || cellElementOptions.disabled;
  const { colors } = useExtendedTheme();

  return (
    <CellContainer elementOptions={cellElementOptions}>
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1,
          marginRight: cellElementOptions.itemSpacing,
        }}>
        <Text
          style={[
            defaultCellElementOptions.labelStyle,
            cellElementOptions.labelStyle,
            { color: isDisabled ? colors.textDisabled : colors.text },
          ]}>
          {props.label}
        </Text>
        {props.caption && (
          <Text
            style={[
              defaultCellElementOptions.captionStyle,
              cellElementOptions.captionStyle,
              { color: isDisabled ? colors.captionDisabled : colors.caption },
            ]}>
            {props.caption}
          </Text>
        )}
      </View>
      <Switch
        disabled={isDisabled}
        value={props.value}
        onValueChange={props.onValueChange}
        thumbColor={
          Platform.OS === 'android'
            ? props.value
              ? isDisabled
                ? color.accentDisabled
                : color.accentFocused
              : isDisabled
              ? color.gray100
              : color.gray200
            : undefined
        }
        trackColor={
          Platform.OS === 'ios'
            ? { true: color.green500 }
            : {
                true: color.blue100,
                false: isDisabled ? color.gray200 : color.gray300,
              }
        }
      />
    </CellContainer>
  );
}
