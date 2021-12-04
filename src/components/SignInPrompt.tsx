import * as React from 'react';
import { ScrollView, Text } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';
import { RootStackNavigationProp } from 'src/navigation';

import Spacer from './Spacer';
import { Button } from './buttons';

export type SignInPromptProps = {
  title?: string;
  caption?: string;
  clearHeaderRight?: boolean;
};

export default function SignInPrompt(props: SignInPromptProps) {
  const { colors } = useExtendedTheme();
  const navigation = useNavigation<RootStackNavigationProp>();

  const handlePressSignIn = () => {
    navigation.navigate('AuthPrompt', { screen: 'AuthStart' });
  };

  React.useLayoutEffect(() => {
    if (props.clearHeaderRight) {
      navigation.setOptions({
        headerRight: undefined,
        headerTintColor: colors.text,
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
      });
    }
  }, [navigation, props.clearHeaderRight, colors.text]);

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: constants.layout.spacing.xxl,
      }}>
      <Text
        maxFontSizeMultiplier={1.2}
        style={[
          constants.font.h3,
          { color: colors.text, textAlign: 'center' },
        ]}>
        {props.title ?? "You're not signed in"}
      </Text>
      <Spacer.Vertical value="sm" />
      <Text
        maxFontSizeMultiplier={1.2}
        style={[
          constants.font.medium,
          { color: colors.text, textAlign: 'center' },
        ]}>
        {props.caption ?? 'Sign in to get the most out of Discovrr.'}
      </Text>
      <Spacer.Vertical value="md" />
      <Button
        title="Sign In"
        variant="contained"
        containerStyle={{ width: 120 }}
        innerTextProps={{ allowFontScaling: false }}
        onPress={handlePressSignIn}
      />
    </ScrollView>
  );
}
