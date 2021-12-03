import * as React from 'react';
import { Text, View } from 'react-native';
import { useField } from 'formik';

import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';

import Spacer from '../Spacer';
import { TextInputProps } from './TextInput';

export type LabelledInputProps = TextInputProps & {
  label: string;
};

export const withLabelledVariant =
  (WrappedComponent: React.ComponentType<TextInputProps>) =>
  (props: LabelledInputProps) => {
    const { label, ...restProps } = props;
    const { colors } = useExtendedTheme();

    return (
      <View>
        <Text
          maxFontSizeMultiplier={1.2}
          style={[
            constants.font.small,
            { color: colors.text, paddingLeft: constants.layout.spacing.sm },
          ]}>
          {label}
        </Text>
        <Spacer.Vertical value="sm" />
        <WrappedComponent {...restProps} />
      </View>
    );
  };

export type FormikInputProps = Omit<
  TextInputProps,
  'value' | 'onChange' | 'onBlur'
> & {
  fieldName: string;
};

export const withFormikVariant =
  (WrappedComponent: React.ComponentType<TextInputProps>) =>
  (props: FormikInputProps) => {
    const { fieldName, ...restProps } = props;
    const [field, meta] = useField(fieldName);

    return (
      <WrappedComponent
        {...restProps}
        value={meta.value}
        onChange={field.onChange(fieldName)}
        // onBlur={field.onBlur(fieldName)}
        error={meta.touched ? meta.error : undefined}
      />
    );
  };

export type LabelledFormikInputProps = FormikInputProps & LabelledInputProps;

export const withLabelledFormikVariant =
  (WrappedComponent: React.ComponentType<TextInputProps>) =>
  (props: LabelledFormikInputProps) => {
    const { fieldName, label, ...restProps } = props;
    const [field, meta] = useField(fieldName);
    const { colors } = useExtendedTheme();

    return (
      <View>
        <Text
          maxFontSizeMultiplier={1.2}
          style={[
            constants.font.small,
            { color: colors.text, paddingLeft: constants.layout.spacing.sm },
          ]}>
          {label}
        </Text>
        <Spacer.Vertical value="sm" />
        <WrappedComponent
          {...restProps}
          value={meta.value}
          onChangeText={field.onChange(fieldName)}
          // onBlur={field.onBlur(fieldName)}
          error={meta.touched ? meta.error : undefined}
        />
      </View>
    );
  };
