import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import TextInput, { TextInputProps } from './TextInput';
import {
  colors as color,
  typography as font,
  values as layout,
} from '../constants';

type FormikInputProps = TextInputProps & {
  formikProps: any;
  field: any;
};

export default function FormikInput(props: FormikInputProps) {
  const { formikProps, field, ...textInputProps } = props;

  return (
    <View style={[formikInputStyles.textInputContainer, props.style]}>
      <TextInput
        {...textInputProps}
        error={formikProps.touched[field] && formikProps.errors[field]}
        value={formikProps.values[field]}
        onChangeText={formikProps.handleChange(field)}
        onBlur={formikProps.handleBlur(field)}
        style={formikInputStyles.textInput}
      />
      {field && formikProps.touched[field] && formikProps.errors[field] && (
        <Text style={formikInputStyles.textInputMessage}>
          {formikProps.errors[field]}
        </Text>
      )}
    </View>
  );
}

const formikInputStyles = StyleSheet.create({
  textInput: {
    marginBottom: layout.spacing.sm,
  },
  textInputMessage: {
    fontSize: font.size.sm,
    color: color.red500,
    marginHorizontal: layout.spacing.md,
  },
  textInputContainer: {
    marginBottom: layout.spacing.lg,
  },
});
