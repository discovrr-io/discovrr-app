import React, { useContext } from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { color } from 'src/constants';

import CellContainer from './CellContainer';
import { CellSelectContext } from './CellSelect';
import { useCellElementContext } from './hooks';

import { CellElementProps, defaultCellElementOptions } from './common';

type CellOptionProps = CellElementProps & {
  label: string;
  value: string;
  caption?: string;
};

export default function CellOption(props: CellOptionProps) {
  const cellElementOptions = useCellElementContext(props.elementOptions);
  const cellSelectProps = useContext(CellSelectContext);

  const isSelectedOption = cellSelectProps.value === props.value;
  const isDisabled = cellSelectProps.disabled || cellElementOptions.disabled;

  return (
    <TouchableHighlight
      disabled={isDisabled}
      underlayColor={cellElementOptions.highlightColor}
      onPress={() => cellSelectProps.onValueChanged(props.value)}>
      <CellContainer elementOptions={cellElementOptions}>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
          <Text
            style={[
              defaultCellElementOptions.labelStyle,
              cellElementOptions.labelStyle,
              isDisabled && { color: color.disabledDarkTextColor },
            ]}>
            {props.label}
          </Text>
          {props.caption && (
            <Text
              numberOfLines={3}
              style={[
                defaultCellElementOptions.captionStyle,
                cellElementOptions.captionStyle,
                isDisabled && { color: color.disabledDarkTextColor },
              ]}>
              {props.caption}
            </Text>
          )}
        </View>
        <Icon
          size={cellElementOptions.iconSize}
          name={isSelectedOption ? 'checkmark-circle' : 'ellipse-outline'}
          color={
            isDisabled
              ? color.disabledDarkTextColor
              : isSelectedOption
              ? color.green500
              : color.gray500
          }
        />
      </CellContainer>
    </TouchableHighlight>
  );
}
