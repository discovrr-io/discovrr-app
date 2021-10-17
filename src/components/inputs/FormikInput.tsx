import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormikProps } from 'formik';

import TextInput, { TextInputProps } from './TextInput';
import { color, font, layout } from 'src/constants';

type FormikInputProps<FormValues> = TextInputProps & {
  formikProps: FormikProps<FormValues>;
  formikField: keyof FormValues;
};

export default function FormikInput<FormValues>({
  formikProps,
  formikField,
  containerStyle,
  secureTextEntry,
  ...textInputProps
}: FormikInputProps<FormValues>) {
  const [hidePassword, setHidePassword] = useState(true);

  const fieldValue = String(formikProps.values[formikField]);
  const didTouchField = formikProps.touched[formikField];
  const errorValue = formikProps.errors[formikField];

  const hasError = didTouchField && Boolean(errorValue);

  return (
    <View style={containerStyle}>
      <TextInput
        {...textInputProps}
        mode="outlined"
        size="large"
        hasError={hasError}
        value={fieldValue}
        onChangeText={formikProps.handleChange(formikField)}
        onBlur={formikProps.handleBlur(String(formikField))}
        containerStyle={{
          backgroundColor: color.white,
          borderColor: hasError ? color.danger : color.black,
        }}
        secureTextEntry={hidePassword && secureTextEntry}
        suffix={
          secureTextEntry && (
            <TextInput.Icon
              activeOpacity={1}
              name={hidePassword ? 'eye' : 'eye-off'}
              size={24}
              onPress={() => setHidePassword(prev => !prev)}
            />
          )
        }
      />
      {hasError && (
        <Text style={formikInputStyles.textInputMessage}>{errorValue}</Text>
      )}
    </View>
  );
}

const formikInputStyles = StyleSheet.create({
  textInputMessage: {
    ...font.small,
    color: color.danger,
    marginTop: layout.spacing.xs,
    marginHorizontal: layout.spacing.md,
  },
});
