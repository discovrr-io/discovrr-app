import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

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
  destructive?: boolean;
  onPress?: () => void | Promise<void>;
};

export default function CellButton(props: CellButtonProps) {
  const cellElementOptions = useCellElementContext(props.elementOptions);
  const isDisabled = cellElementOptions.disabled;

  const labelTextColor = useMemo(() => {
    if (isDisabled) {
      return props.destructive
        ? color.dangerDisabled
        : color.disabledDarkTextColor;
    } else {
      return props.destructive ? color.danger : color.defaultDarkTextColor;
    }
  }, [isDisabled, props.destructive]);

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
              color={labelTextColor}
            />
            <Spacer.Horizontal value={cellElementOptions.itemSpacing} />
          </>
        )}
        <View style={styles.leadingContainer}>
          <Text
            numberOfLines={1}
            style={[
              defaultCellElementOptions.labelStyle,
              cellElementOptions.labelStyle,
              { color: labelTextColor },
            ]}>
            {props.label}
          </Text>
          {props.caption && (
            <Text
              numberOfLines={2}
              style={[
                defaultCellElementOptions.captionStyle,
                cellElementOptions.captionStyle,
                isDisabled && { color: color.disabledDarkTextColor },
              ]}>
              {props.caption}
            </Text>
          )}
        </View>
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
              color={labelTextColor}
            />
          </>
        )}
      </CellContainer>
    </TouchableHighlight>
  );
}

const styles = StyleSheet.create({
  leadingContainer: {
    flexGrow: 1,
    flexShrink: 1,
  },
  previewValueText: {
    maxWidth: '40%',
    textAlign: 'right',
  },
});
