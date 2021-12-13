import * as React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useHeaderHeight } from '@react-navigation/elements';

import * as constants from 'src/constants';
import { Button, Spacer, Text } from 'src/components';
import { OnboardingStackScreenProps } from 'src/navigation';

const COVER_IMAGE = require('../../../assets/images/onboarding/start.png');

type OnboardingStartScreenProps = OnboardingStackScreenProps<'OnboardingStart'>;

export default function OnboardingStartScreen(
  props: OnboardingStartScreenProps,
) {
  const headerHeight = useHeaderHeight();

  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => (
        <Button
          title="Continue as Guest"
          size="medium"
          overrideTheme="light-content"
          containerStyle={{
            flex: 1,
            alignItems: 'flex-end',
            paddingHorizontal: 0,
            marginRight: constants.layout.defaultScreenMargins.horizontal,
          }}
        />
      ),
    });
  }, [props.navigation]);

  return (
    <SafeAreaView style={[{ flex: 1, marginTop: headerHeight }]}>
      <StatusBar animated barStyle="light-content" />
      <FastImage
        resizeMode="contain"
        source={COVER_IMAGE}
        style={[styles.coverImage]}
      />
      <View style={[styles.contentContainer]}>
        <Text size="h2" weight="800" style={[styles.text]}>
          Hi there! 👋
        </Text>
        <Spacer.Vertical value="lg" />
        <View>
          <Text style={[styles.text]}>
            Welcome! Discovrr is a place where you can explore and see what
            local makers and creators are making in your community.
          </Text>
          <Spacer.Vertical value="md" />
          <Text style={[styles.text]}>
            Let&apos;s start by creating a new account with Discovrr.
          </Text>
        </View>
        <Spacer.Vertical value="xl" />
        <View>
          <Button
            title="Get Started"
            variant="contained"
            overrideTheme="light-content"
            textStyle={{ color: constants.color.blue700 }}
            onPress={() => props.navigation.navigate('OnboardingAccountType')}
          />
          <Spacer.Vertical value="md" />
          <Button
            title="Sign In"
            variant="outlined"
            overrideTheme="light-content"
            underlayColor={constants.color.accent}
            containerStyle={{
              borderColor: constants.color.absoluteWhite,
            }}
            onPress={() => {}}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  coverImage: {
    flexGrow: 1,
    width: '100%',
  },
  contentContainer: {
    padding: constants.layout.spacing.xxl,
  },
  text: {
    color: constants.color.absoluteWhite,
  },
});
