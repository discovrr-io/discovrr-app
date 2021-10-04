import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';

import { Spacer } from 'src/components';
import { color } from 'src/constants';

import CellContainer from './CellContainer';
import { CellElementProps, defaultCellElementOptions } from './common';
import { useCellElementContext } from './hooks';

export type CellButtonProps = CellElementProps & {
  label: string;
  caption?: string;
  iconName?: string;
  suffixIconName?: string;
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
      <CellContainer
        elementOptions={cellElementOptions}
        style={styles.container}>
        <View style={styles.leadingContainer}>
          {props.iconName && (
            <>
              <Icon
                name={props.iconName}
                size={cellElementOptions.iconSize}
                color={isDisabled ? color.disabledDarkTextColor : color.black}
              />
              <Spacer.Horizontal value={cellElementOptions.itemSpacing} />
            </>
          )}
          <View style={styles.labelContainerStyle}>
            <Text
              numberOfLines={1}
              style={[
                defaultCellElementOptions.labelStyle,
                cellElementOptions.labelStyle,
                isDisabled && { color: color.gray500 },
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
          </View>
        </View>
        {props.suffixIconName && (
          <View style={styles.trailingContainer}>
            <Spacer.Horizontal value={cellElementOptions.itemSpacing} />
            <Icon
              name={props.suffixIconName}
              size={cellElementOptions.iconSize}
              color={isDisabled ? color.disabledDarkTextColor : color.black}
            />
          </View>
        )}
      </CellContainer>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  leadingContainer: {
    flexGrow: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  labelContainerStyle: {
    flexGrow: 1,
    flexShrink: 1,
  },
  trailingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
