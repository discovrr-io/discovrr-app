import * as React from 'react';
import { useExtendedTheme } from 'src/hooks';

import TextInput, { TextInputProps } from './TextInput';
import {
  withFormikVariant,
  withLabelledFormikVariant,
  withLabelledVariant,
} from './hocs';

export type PasswordInputProps = Omit<
  TextInputProps,
  'secureTextEntry' | 'suffix'
>;

export default function PasswordInput(props: PasswordInputProps) {
  const { colors } = useExtendedTheme();
  const [hidePassword, setHidePassword] = React.useState(true);

  return (
    <TextInput
      {...props}
      secureTextEntry={hidePassword}
      suffix={
        <TextInput.Icon
          size={24}
          activeOpacity={1}
          disabled={props.editable === false}
          name={hidePassword ? 'eye' : 'eye-off'}
          color={props.editable === false ? colors.textDisabled : colors.text}
          onPress={() => setHidePassword(prev => !prev)}
        />
      }
    />
  );
}

export const FormikPasswordInput = withFormikVariant(PasswordInput);
export const LabelledPasswordInput = withLabelledVariant(PasswordInput);
export const LabelledFormikPasswordInput =
  withLabelledFormikVariant(PasswordInput);
