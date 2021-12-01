import * as React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';
import { AuthPromptStackParamList } from 'src/navigation';

import AuthNavigator from './AuthNavigator';
import TermsAndConditionsScreen from './TermsAndConditions';
import { HeaderIcon } from 'src/components';

const AuthPromptStack = createStackNavigator<AuthPromptStackParamList>();

export default function AuthPromptNavigator() {
  const { colors } = useExtendedTheme();
  return (
    <AuthPromptStack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        headerTintColor: colors.text,
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
        headerBackTitleVisible: false,
        headerTitleAllowFontScaling: false,
      }}>
      <AuthPromptStack.Screen
        name="Auth"
        component={AuthNavigator}
        options={{ headerLeft: props => <HeaderIcon.Close {...props} /> }}
      />
      <AuthPromptStack.Screen
        name="TermsAndConditions"
        component={TermsAndConditionsScreen}
        options={{ headerLeft: props => <HeaderIcon.Back {...props} /> }}
      />
    </AuthPromptStack.Navigator>
  );
}
