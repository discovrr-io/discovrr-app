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

const OnboardingStack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  return (
    <OnboardingStack.Navigator
      initialRouteName="OnboardingStart"
      screenOptions={{
        headerTransparent: true,
        headerTintColor: constants.color.absoluteWhite,
        headerTitle: () => null, // Explicity don't render title
        headerLeft: props => <HeaderIcon.Back {...props} />,
        cardStyle: { backgroundColor: constants.color.blue700 },
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
        component={PlaceholderScreen}
      />
    </OnboardingStack.Navigator>
  );
}
