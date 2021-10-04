import React, { useContext } from 'react';
import {
  Platform,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
  ViewStyle,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { IconProps } from 'react-native-vector-icons/Icon';

import { color, font, layout } from 'src/constants';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';

import CellContainer from './CellContainer';
import { CellInputGroupContext } from './CellInputGroup';
import { CellElementProps, defaultCellElementOptions } from './common';
import { useCellElementContext } from './hooks';
import { Spacer } from 'src/components';

type CellInputProps = CellElementProps &
  Pick<
    TextInputProps,
    | 'autoCapitalize'
    | 'multiline'
    | 'placeholder'
    | 'onBlur'
    | 'onChangeText'
    | 'value'
  > & {
    label: string;
    prefix?: React.ReactNode;
    suffix?: React.ReactNode;
    error?: string | undefined;
  };

const CellInput = (props: CellInputProps) => {
  const { label, prefix, suffix, error, ...textInputProps } = props;

  const cellElementOptions = useCellElementContext(props.elementOptions);
  const cellInputGroupProps = useContext(CellInputGroupContext);

  return (
    <CellContainer style={{ paddingVertical: 0, paddingHorizontal: 0 }}>
      <View
        style={{
          height: '100%',
          flex: cellInputGroupProps.labelFlex,
          flexDirection: 'row',
          justifyContent: 'space-between',
          backgroundColor: cellElementOptions.highlightColor,
        }}>
        <Text
          numberOfLines={1}
          style={[
            defaultCellElementOptions.labelStyle,
            cellElementOptions.labelStyle,
            cellElementOptions.disabled && {
              color: color.disabledDarkTextColor,
            },
            {
              paddingVertical: cellElementOptions.containerSpacingVertical,
              padding: cellElementOptions.containerSpacingHorizontal,
            },
          ]}>
          {label}
        </Text>
        <View
          style={{
            borderLeftWidth: cellElementOptions.borderWidth,
            borderColor: cellElementOptions.borderColor,
          }}
        />
      </View>
      <View
        style={{
          flex: cellInputGroupProps.inputFlex,
          paddingLeft: cellElementOptions.itemSpacing,
          paddingRight: cellElementOptions.containerSpacingHorizontal,
          paddingVertical: cellElementOptions.itemSpacing,
        }}>
        <View style={[{ flexGrow: 1, flexDirection: 'row' }]}>
          {prefix && (
            <>
              {prefix}
              <Spacer.Horizontal value={layout.spacing.sm} />
            </>
          )}
          <TextInput
            maxLength={140}
            editable={!cellElementOptions.disabled}
            placeholder="Enter some text..."
            placeholderTextColor={color.gray500}
            selectionColor={Platform.OS === 'ios' ? color.accent : undefined}
            style={[
              { flexGrow: 1, flexShrink: 1, padding: 0 },
              font.medium,
              textInputProps.multiline && { minHeight: 90, maxHeight: 140 },
              cellElementOptions.disabled && {
                color: color.disabledDarkTextColor,
              },
              textInputProps.multiline &&
                Platform.OS === 'android' && {
                  textAlignVertical: 'top',
                  paddingTop: layout.spacing.sm,
                },
            ]}
            {...textInputProps}
          />
          {suffix && (
            <>
              <Spacer.Horizontal value={layout.spacing.sm} />
              {suffix}
            </>
          )}
        </View>
        {error && (
          <Text
            style={[
              font.small,
              { color: color.danger, marginTop: layout.spacing.sm },
            ]}>
            {error}
          </Text>
        )}
      </View>
    </CellContainer>
  );
};

type CellInputAffixProps = {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export const CellInputAffix = (props: CellInputAffixProps) => {
  const { text, textStyle, containerStyle } = props;
  const cellElementOptions = useCellElementContext({});

  return (
    <View style={[{ justifyContent: 'center' }, containerStyle]}>
      <Text
        style={[
          cellElementOptions.labelStyle,
          { color: color.gray500 },
          textStyle,
        ]}>
        {text}
      </Text>
    </View>
  );
};

type CellInputIconProps = CellElementProps &
  Pick<IconProps, 'name' | 'size' | 'color' | 'onPress'> & {
    activeOpacity?: TouchableOpacityProps['activeOpacity'];
    containerStyle?: StyleProp<ViewStyle>;
  };

const CellInputIcon = (props: CellInputIconProps) => {
  const {
    activeOpacity,
    containerStyle,
    elementOptions,
    onPress,
    ...iconProps
  } = props;
  const cellElementOptions = useCellElementContext(elementOptions);

  return (
    <TouchableOpacity
      disabled={cellElementOptions.disabled}
      activeOpacity={activeOpacity ?? DEFAULT_ACTIVE_OPACITY}
      onPress={onPress}
      style={[containerStyle]}>
      <Icon size={24} {...iconProps} />
    </TouchableOpacity>
  );
};

CellInput.Affix = CellInputAffix;
CellInput.Icon = CellInputIcon;

export default CellInput;
