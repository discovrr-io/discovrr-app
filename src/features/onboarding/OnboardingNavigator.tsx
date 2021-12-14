import * as React from 'react';

import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';

import * as constants from 'src/constants';
import { HeaderIcon, PlaceholderScreen } from 'src/components';
import { OnboardingStackParamList } from 'src/navigation';

import OnboardingStartScreen from './OnboardingStartScreen';
import OnboardingAccountTypeScreen from './OnboardingAccountTypeScreen';
import OnboardingPushNotifications from './OnboardingPushNotificationsScreen';

const OnboardingStack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      initialRouteName="OnboardingStart"
      screenOptions={{
        headerTransparent: true,
        headerTintColor: constants.color.absoluteWhite,
        headerTitle: () => null, // Explicity don't render title
        headerLeft: props => <HeaderIcon.Back name="arrow-back" {...props} />,
        headerLeftContainerStyle: {
          paddingLeft: constants.layout.defaultScreenMargins.horizontal,
        },
        headerRightContainerStyle: {
          paddingRight: constants.layout.defaultScreenMargins.horizontal,
        },
        cardStyle: {
          backgroundColor: constants.color.accentFocused,
        },
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
      }}>
      <OnboardingStack.Screen
        name="OnboardingStart"
        component={OnboardingStartScreen}
        options={{ headerLeft: undefined }}
      />
      <OnboardingStack.Screen
        name="OnboardingAccountType"
        component={OnboardingAccountTypeScreen}
      />
      <OnboardingStack.Screen
        name="OnboardingPersonalDetails"
        component={PlaceholderScreen}
      />
      <OnboardingStack.Screen
        name="OnboardingProfileDetails"
        component={PlaceholderScreen}
      />
      <OnboardingStack.Screen
        name="OnboardingPushNotifications"
        component={OnboardingPushNotifications}
      />
    </OnboardingStack.Navigator>
  );
}
