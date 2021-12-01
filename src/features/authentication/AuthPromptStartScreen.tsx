import * as React from 'react';
import { Text } from 'react-native';

import { AuthPromptStackScreenProps } from 'src/navigation';

type AuthPromptStartScreenProps = AuthPromptStackScreenProps<'Start'>;

export default function AuthPromptStartScreen(
  props: AuthPromptStartScreenProps,
) {
  return <Text>START</Text>;
}
