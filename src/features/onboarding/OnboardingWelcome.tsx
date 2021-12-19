import * as React from 'react';
import { SafeAreaView, View } from 'react-native';

import * as Animatable from 'react-native-animatable';

import * as constants from 'src/constants';
import { Button, Spacer, Text } from 'src/components';
import { OnboardingStackScreenProps } from 'src/navigation';

type OnboardingWelcomeScreenProps =
  OnboardingStackScreenProps<'OnboardingWelcome'>;

export default function OnboardingWelcomeScreen(
  props: OnboardingWelcomeScreenProps,
) {
  return (
    <SafeAreaView style={{ flex: 1, margin: constants.layout.spacing.xxl }}>
      <Animatable.View
        animation="tada"
        style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text
          adjustsFontSizeToFit
          allowFontScaling={false}
          size={120}
          style={{ textAlign: 'center' }}>
          🎉
        </Text>
      </Animatable.View>
      <View>
        <Text size="h3" weight="800">
          You’re now a member!
        </Text>
        <Spacer.Vertical value="lg" />
        <View>
          <Text>Thank you for creating an account with us!</Text>
          <Spacer.Vertical value="md" />
          <Text>
            Let’s answer a few questions to set up your profile. It won’t take
            long.
          </Text>
        </View>
      </View>
      <Spacer.Vertical value="xl" />
      <Button
        title="Let’s Go"
        type="primary"
        variant="contained"
        onPress={() => props.navigation.navigate('OnboardingAccountType')}
      />
    </SafeAreaView>
  );
}
