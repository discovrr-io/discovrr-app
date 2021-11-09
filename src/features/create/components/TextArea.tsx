import * as React from 'react';
import {
  Platform,
  StyleProp,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { useField } from 'formik';

import CharacterCounter from './CharacterCounter';
import { color, font, layout } from 'src/constants';

export type TextAreaProps = TextInputProps & {
  fieldName: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function TextArea(props: TextAreaProps) {
  const { fieldName, style, containerStyle, ...restProps } = props;
  const [field, meta] = useField<string>(fieldName);

  return (
    <View style={containerStyle}>
      <View
        style={{
          flexDirection: 'row-reverse',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        {props.maxLength && (
          <CharacterCounter
            currentLength={field.value.length}
            maxLength={props.maxLength}
            style={{ paddingVertical: layout.spacing.sm }}
          />
        )}
        {meta.touched && meta.error && (
          <Text
            style={[
              font.smallBold,
              {
                flexGrow: 1,
                flexShrink: 1,
                color: color.danger,
                paddingVertical: layout.spacing.sm,
              },
            ]}>
            {meta.error}
          </Text>
        )}
      </View>
      <TextInput
        {...restProps}
        multiline
        maxLength={undefined}
        placeholderTextColor={color.gray500}
        selectionColor={Platform.select({ ios: color.accent })}
        value={field.value}
        onChangeText={field.onChange(fieldName)}
        onBlur={field.onBlur(fieldName)}
        style={[
          font.extraLarge,
          {
            textAlignVertical: 'top',
            minHeight: !meta.error ? '20%' : undefined,
          },
          style,
        ]}
      />
    </View>
  );
}
