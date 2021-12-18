import * as React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useHeaderHeight } from '@react-navigation/elements';

import * as constants from 'src/constants';
import * as authSlice from 'src/features/authentication/auth-slice';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { Button, Spacer, Text } from 'src/components';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { User } from 'src/models';

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
  const { user } = useAppSelector(state => state.auth);

  React.useLayoutEffect(() => {
    props.navigation.setOptions({
      headerRight: () => (
        <Button
          title="Continue as Guest"
          size="medium"
          overrideTheme="light-content"
          textStyle={{ textAlign: 'right' }}
          onPress={() =>
            props.navigation
              .getParent<RootStackNavigationProp>()
              .navigate('Main', {
                screen: 'Facade',
                params: { screen: 'Home', params: { screen: 'Landing' } },
              })
          }
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
  }, [props.navigation]);

  const handleStartOnboarding = React.useCallback(
    async (user: User) => {
      try {
        const myProfile = await dispatch(
          profilesSlice.fetchProfileById({
            profileId: user.profileId,
            reload: true,
          }),
        ).unwrap();
        console.log('ONBOARDING START', { myProfile });
        if (!myProfile.didCompleteMainOnboarding) {
          props.navigation.navigate('OnboardingAccountType');
        } else {
          props.navigation
            .getParent<RootStackNavigationProp>()
            .navigate('Main', {
              screen: 'Facade',
              params: { screen: 'Home', params: { screen: 'Landing' } },
            });
        }
      } catch (error) {
        console.error('Failed to fetch profile for current user:', error);
      }
    },
    [dispatch, props.navigation],
  );

  const handlePressGetStarted = React.useCallback(() => {
    if (user) {
      handleStartOnboarding(user);
    } else {
      props.navigation
        .getParent<RootStackNavigationProp>()
        .navigate('AuthPrompt', { screen: 'AuthStart' });
    }
  }, [props.navigation, user, handleStartOnboarding]);

  React.useEffect(() => {
    console.log({ user });
    if (user) {
      console.log('GOT VALID USER:', user);
      handleStartOnboarding(user);
    }
  }, [props.navigation, user, handleStartOnboarding]);

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
