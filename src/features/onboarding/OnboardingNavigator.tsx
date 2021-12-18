import * as React from 'react';

import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';

import * as constants from 'src/constants';
import { HeaderIcon } from 'src/components';
import { useExtendedTheme } from 'src/hooks';
import { OnboardingStackParamList } from 'src/navigation';

import OnboardingStartScreen from './OnboardingStartScreen';
import OnboardingAccountTypeScreen from './OnboardingAccountTypeScreen';
import OnboardingPersonalNameScreen from './OnboardingPersonalNameScreen';
import OnboardingUsernameScreen from './OnboardingUsernameScreen';
import OnboardingProfilePictureScreen from './OnboardingProfilePictureScreen';
import OnboardingPushNotifications from './OnboardingPushNotificationsScreen';
import OnboardingSurveyScreen from './OnboardingSurveyScreen';

const OnboardingStack = createStackNavigator<OnboardingStackParamList>();

export default function OnboardingNavigator() {
  const { colors } = useExtendedTheme();
  return (
    <OnboardingStack.Navigator
      initialRouteName="OnboardingStart"
      screenOptions={{
        headerTitleAllowFontScaling: false,
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
        headerLeftContainerStyle: {
          paddingLeft: constants.layout.defaultScreenMargins.horizontal,
        },
        headerRightContainerStyle: {
          paddingRight: constants.layout.defaultScreenMargins.horizontal,
        },
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
      }}>
      <OnboardingStack.Group>
        <OnboardingStack.Screen
          name="OnboardingStart"
          component={OnboardingStartScreen}
          options={{
            headerTransparent: true,
            headerTintColor: constants.color.absoluteWhite,
            headerTitle: () => null, // Explicity don't render title
            cardStyle: {
              backgroundColor: constants.color.accentFocused,
            },
          }}
        />
      </OnboardingStack.Group>
      <OnboardingStack.Group
        screenOptions={{
          headerTintColor: colors.text,
          headerLeft: props => <HeaderIcon.Back name="arrow-back" {...props} />,
          cardStyle: {
            backgroundColor: colors.card,
          },
        }}>
        <OnboardingStack.Screen
          name="OnboardingAccountType"
          component={OnboardingAccountTypeScreen}
          options={{
            title: 'Getting Started',
            headerLeft: () => null,
          }}
        />
        <OnboardingStack.Screen
          name="OnboardingPersonalName"
          component={OnboardingPersonalNameScreen}
          options={{ title: 'Name' }}
        />
        <OnboardingStack.Screen
          name="OnboardingUsername"
          component={OnboardingUsernameScreen}
          options={{ title: 'Username' }}
        />
        <OnboardingStack.Screen
          name="OnboardingProfilePicture"
          component={OnboardingProfilePictureScreen}
          options={{ title: 'Profile Picture' }}
        />
        <OnboardingStack.Screen
          name="OnboardingPushNotifications"
          component={OnboardingPushNotifications}
          options={{ title: 'Notifications' }}
        />
        <OnboardingStack.Screen
          name="OnboardingSurvey"
          component={OnboardingSurveyScreen}
          options={{ title: 'Survey' }}
        />
      </OnboardingStack.Group>
    </OnboardingStack.Navigator>
  );
}
