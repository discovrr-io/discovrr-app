import * as React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useHeaderHeight } from '@react-navigation/elements';

import * as constants from 'src/constants';
import * as authSlice from 'src/features/authentication/auth-slice';
import { Button, Spacer, Text } from 'src/components';
import { useAppDispatch, useAppSelector } from 'src/hooks';

import {
  OnboardingStackScreenProps,
  RootStackNavigationProp,
} from 'src/navigation';

const COVER_IMAGE = require('../../../assets/images/onboarding/start.png');

type OnboardingStartScreenProps = OnboardingStackScreenProps<'OnboardingStart'>;

export default function OnboardingStartScreen(
  props: OnboardingStartScreenProps,
) {
  const dispatch = useAppDispatch();
  const headerHeight = useHeaderHeight();

  const { user, didSetUpProfile } = useAppSelector(state => {
    return {
      user: state.auth.user,
      didSetUpProfile: state.onboarding.didSetUpProfile,
    };
  });

  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => (
        <Button
          title="Continue as Guest"
          size="medium"
          overrideTheme="light-content"
          textStyle={{ textAlign: 'right' }}
          onPress={() => props.navigation.goBack()}
          containerStyle={{
            flexGrow: 1,
            alignItems: 'flex-end',
            alignSelf: 'flex-end',
            paddingHorizontal: 0,
            marginRight: constants.layout.defaultScreenMargins.horizontal,
          }}
        />
      ),
      headerLeftContainerStyle: {
        flexGrow: 0,
      },
      headerTitleContainerStyle: {
        flexGrow: 0,
      },
    });
  }, [props.navigation, user]);

  const handlePressGetStarted = React.useCallback(() => {
    if (user) {
      if (!didSetUpProfile) {
        props.navigation.navigate('OnboardingAccountType');
      } else {
        props.navigation.goBack();
      }
    } else {
      props.navigation
        .getParent<RootStackNavigationProp>()
        .navigate('AuthPrompt', { screen: 'AuthStart' });
    }
  }, [props.navigation, user, didSetUpProfile]);

  React.useEffect(() => {
    if (user && didSetUpProfile) {
      props.navigation.goBack();
    }
  }, [props.navigation, user, didSetUpProfile]);

  return (
    <SafeAreaView style={[{ flex: 1, marginTop: headerHeight }]}>
      <StatusBar barStyle="light-content" />
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
            Let’s start by signing in or creating a new account with Discovrr.
            It’ll be quick!
          </Text>
        </View>
        <Spacer.Vertical value="xl" />
        <View>
          <Button
            title="Get Started"
            variant="contained"
            overrideTheme="light-content"
            textStyle={{ color: constants.color.accentFocused }}
            containerStyle={{ backgroundColor: constants.color.absoluteWhite }}
            onPress={handlePressGetStarted}
          />
          {__DEV__ && Boolean(user) && (
            <>
              <Spacer.Vertical value="md" />
              <Button
                title="Sign Out"
                type="danger"
                variant="contained"
                onPress={async () => {
                  try {
                    await dispatch(authSlice.signOut()).unwrap();
                  } catch (error) {
                    console.warn('Failed to sign out:', error);
                  }
                }}
              />
            </>
          )}
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
