import * as React from 'react';
import { Text } from 'react-native';

import { AuthPromptStackScreenProps } from 'src/navigation';

type AuthPromptForgotPasswordScreenProps =
  AuthPromptStackScreenProps<'ForgotPassword'>;

export default function AuthPromptForgotPasswordScreen(
  props: AuthPromptForgotPasswordScreenProps,
) {
  return <Text>FORGOT</Text>;
}
