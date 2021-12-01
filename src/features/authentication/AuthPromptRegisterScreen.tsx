import * as React from 'react';
import { Text } from 'react-native';

import { AuthPromptStackScreenProps } from 'src/navigation';

type AuthPromptRegisterScreenProps = AuthPromptStackScreenProps<'Register'>;

export default function AuthPromptRegisterScreen(
  props: AuthPromptRegisterScreenProps,
) {
  return <Text>REGISTER</Text>;
}
