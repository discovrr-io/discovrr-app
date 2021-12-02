import * as React from 'react';
import { Text } from 'react-native';

import { AuthPromptStackScreenProps } from 'src/navigation';

type AuthPromptLoginScreenProps = AuthPromptStackScreenProps<'Login'>;

export default function AuthPromptLoginScreen(
  props: AuthPromptLoginScreenProps,
) {
  return <Text>LOGIN</Text>;
}
