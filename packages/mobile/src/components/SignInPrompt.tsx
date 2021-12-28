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
  const navigation = useNavigation<RootStackNavigationProp>();
  const { colors, dark } = useExtendedTheme();

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
        padding: constants.layout.spacing.xxl * 1.5,
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
          constants.font.body,
          { color: colors.text, textAlign: 'center' },
        ]}>
        {props.caption ??
          'Sign in or create an account to get the most out of Discovrr.'}
      </Text>
      <Spacer.Vertical value="md" />
      <Button
        title="Get Started"
        variant="contained"
        innerTextProps={{ allowFontScaling: false }}
        onPress={handlePressSignIn}
        underlayColor={constants.color.gray300}
        containerStyle={[
          { minWidth: '70%' },
          !dark && {
            backgroundColor: constants.color.gray200,
          },
        ]}
      />
    </ScrollView>
  );
}
