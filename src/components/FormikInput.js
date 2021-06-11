import React from 'react';
import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';

import TextInput from './TextInput';
import { font, layout } from '../constants';

export default function FormikInput({
  formikProps,
  field,
  placeholder,
  keyboardType,
  secureTextEntry,
  autoComplete,
  ...props
}) {
  return (
    <View style={[formikInputStyles.textInputContainer, props.style]}>
      <TextInput
        placeholder={placeholder}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoComplete={autoComplete}
        autoCorrect={false}
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

FormikInput.propTypes = {
  formikProps: PropTypes.object.isRequired,
  field: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  keyboardType: PropTypes.string,
  secureTextEntry: PropTypes.bool,
  autoComplete: PropTypes.string,
};

FormikInput.defaultTypes = {
  placeholder: '',
  keyboardType: 'default',
  secureTextEntry: false,
  autoComplete: 'off',
};

const formikInputStyles = StyleSheet.create({
  textInput: {
    marginBottom: layout.spacing.sm,
  },
  textInputMessage: {
    fontSize: font.size.sm,
    color: 'red',
    marginHorizontal: layout.spacing.md,
  },
  textInputContainer: {
    marginBottom: layout.spacing.lg,
  },
  noAccountText: {
    marginTop: layout.spacing.lg,
    textAlign: 'center',
  },
});
