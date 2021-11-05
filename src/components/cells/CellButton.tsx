import React from 'react';
import { StyleSheet, Text, TouchableHighlight } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import { color } from 'src/constants';

import Spacer from '../Spacer';
import CellContainer from './CellContainer';
import { CellElementProps, defaultCellElementOptions } from './common';
import { useCellElementContext } from './hooks';

export type CellButtonProps = CellElementProps & {
  label: string;
  caption?: string;
  iconName?: string;
  suffixIconName?: string;
  previewValue?: string;
  onPress?: () => void | Promise<void>;
};

export default function CellButton(props: CellButtonProps) {
  const cellElementOptions = useCellElementContext(props.elementOptions);
  const isDisabled = cellElementOptions.disabled;

  return (
    <TouchableHighlight
      disabled={isDisabled}
      underlayColor={cellElementOptions.highlightColor}
      onPress={props.onPress}>
      <CellContainer elementOptions={cellElementOptions}>
        {props.iconName && (
          <>
            <Icon
              name={props.iconName}
              size={cellElementOptions.iconSize}
              color={
                isDisabled
                  ? color.disabledDarkTextColor
                  : color.defaultDarkTextColor
              }
            />
            <Spacer.Horizontal value={cellElementOptions.itemSpacing} />
          </>
        )}
        {/* <View style={styles.labelContainerStyle}> */}
        <Text
          numberOfLines={1}
          style={[
            defaultCellElementOptions.labelStyle,
            cellElementOptions.labelStyle,
            isDisabled && { color: color.disabledDarkTextColor },
            styles.labelText,
          ]}>
          {props.label}
        </Text>
        {props.caption && (
          <Text
            style={[
              defaultCellElementOptions.captionStyle,
              cellElementOptions.captionStyle,
              isDisabled && { color: color.disabledDarkTextColor },
            ]}>
            {props.caption}
          </Text>
        )}
        {/* </View> */}
        {props.previewValue && (
          <>
            <Spacer.Horizontal value={cellElementOptions.itemSpacing} />
            <Text
              numberOfLines={1}
              style={[
                defaultCellElementOptions.labelStyle,
                cellElementOptions.labelStyle,
                styles.previewValueText,
                {
                  color: isDisabled
                    ? color.disabledDarkTextColor
                    : color.gray500,
                },
              ]}>
              {props.previewValue}
            </Text>
          </>
        )}
        {props.suffixIconName && (
          <>
            <Spacer.Horizontal value={cellElementOptions.itemSpacing} />
            <Icon
              name={props.suffixIconName}
              size={cellElementOptions.iconSize}
              color={
                isDisabled
                  ? color.disabledDarkTextColor
                  : color.defaultDarkTextColor
              }
            />
          </>
        )}
      </CellContainer>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  labelText: {
    flexGrow: 1,
    flexShrink: 1,
  },
  previewValueText: {
    maxWidth: '40%',
    textAlign: 'right',
  },
});
