import * as React from 'react';
import { SafeAreaView, StatusBar, View } from 'react-native';

import * as Animatable from 'react-native-animatable';
import FastImage from 'react-native-fast-image';

import * as constants from 'src/constants';
import { Button, Spacer, Text } from 'src/components';
import { useExtendedTheme } from 'src/hooks';
import { OnboardingStackScreenProps } from 'src/navigation';

const CELEBRATE_EMOJI = require('../../../assets/images/onboarding/celebrate-emoji.png');

type OnboardingWelcomeScreenProps =
  OnboardingStackScreenProps<'OnboardingWelcome'>;

export default function OnboardingWelcomeScreen(
  props: OnboardingWelcomeScreenProps,
) {
  const { dark } = useExtendedTheme();

  const animatableRef = React.useRef<Animatable.View & View>(null);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;

    const unsubscribe = props.navigation.addListener('transitionEnd', () => {
      timeout = setTimeout(() => {
        animatableRef.current?.tada?.();
      }, 200);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [props.navigation]);

  return (
    <SafeAreaView style={{ flex: 1, margin: constants.layout.spacing.xxl }}>
      <StatusBar animated barStyle={dark ? 'light-content' : 'dark-content'} />
      <Animatable.View
        ref={animatableRef}
        style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <FastImage
          source={CELEBRATE_EMOJI}
          style={{ height: '50%', maxHeight: 180, aspectRatio: 1 }}
        />
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
        onPress={() =>
          props.navigation.navigate('OnboardingAccountType', { nextIndex: 1 })
        }
      />
    </SafeAreaView>
  );
}
