import * as React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import * as constants from 'src/constants';
import { HeaderIcon } from 'src/components';
import { useExtendedTheme } from 'src/hooks';
import { AuthPromptStackParamList } from 'src/navigation';

import AuthPromptStartScreen from './AuthPromptStartScreen';
import AuthPromptLoginScreen from './AuthPromptLoginScreen';
import AuthPromptRegisterScreen from './AuthPromptRegisterScreen';
import AuthPromptForgotPasswordScreen from './AuthPromptForgotPasswordScreen';
import TermsAndConditionsScreen from './TermsAndConditions';

const AuthPromptStack = createStackNavigator<AuthPromptStackParamList>();

export default function AuthPromptNavigator() {
  const { colors } = useExtendedTheme();
  return (
    <AuthPromptStack.Navigator
      initialRouteName="Start"
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
        headerBackTitleVisible: false,
        headerTitleAllowFontScaling: false,
      }}>
      <AuthPromptStack.Screen name="Start" component={AuthPromptStartScreen} />
      <AuthPromptStack.Screen name="Login" component={AuthPromptLoginScreen} />
      <AuthPromptStack.Screen
        name="Register"
        component={AuthPromptRegisterScreen}
      />
      <AuthPromptStack.Screen
        name="ForgotPassword"
        component={AuthPromptForgotPasswordScreen}
      />
      <AuthPromptStack.Screen
        name="TermsAndConditions"
        component={TermsAndConditionsScreen}
        options={{ headerLeft: props => <HeaderIcon.Back {...props} /> }}
      />
    </AuthPromptStack.Navigator>
  );
}
