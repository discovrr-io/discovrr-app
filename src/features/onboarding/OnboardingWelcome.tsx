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
      <Animatable.View
        ref={animatableRef}
        style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text
          adjustsFontSizeToFit
          allowFontScaling={false}
          size={150}
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
        onPress={() =>
          props.navigation.navigate('OnboardingAccountType', { nextIndex: 1 })
        }
      />
    </SafeAreaView>
  );
}
