import * as React from 'react';
import { Text, TouchableHighlight, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';

import Spacer from '../Spacer';
import CellContainer from './CellContainer';
import { CellOptionGroupContext } from './CellOptionGroup';
import { useCellElementContext } from './hooks';
import { CellElementProps, defaultCellElementOptions } from './common';

export type CellOptionProps = CellElementProps & {
  label: string;
  value: string;
  caption?: string;
};

export default function CellOption(props: CellOptionProps) {
  const cellElementOptions = useCellElementContext(props.elementOptions);
  const cellOptionGroupProps = React.useContext(CellOptionGroupContext);
  const { colors } = useExtendedTheme();

  const isSelectedOption = cellOptionGroupProps.value === props.value;
  const isDisabled =
    cellOptionGroupProps.disabled || cellElementOptions.disabled;

  return (
    <TouchableHighlight
      disabled={isDisabled}
      underlayColor={colors.highlight}
      onPress={() => cellOptionGroupProps.onValueChanged(props.value)}>
      <CellContainer elementOptions={cellElementOptions}>
        <View style={{ flexGrow: 1, flexShrink: 1 }}>
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
              numberOfLines={3}
              style={[
                defaultCellElementOptions.captionStyle,
                cellElementOptions.captionStyle,
                { color: isDisabled ? colors.captionDisabled : colors.caption },
              ]}>
              {props.caption}
            </Text>
          )}
        </View>
        <Spacer.Horizontal value={cellElementOptions.itemSpacing} />
        <Icon
          size={cellElementOptions.iconSize}
          name={isSelectedOption ? 'checkmark-circle' : 'ellipse-outline'}
          color={
            isDisabled
              ? colors.captionDisabled
              : isSelectedOption
              ? constants.color.green500
              : colors.caption
          }
        />
      </CellContainer>
    </TouchableHighlight>
  );
}
