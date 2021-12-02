import * as React from 'react';
import { StyleSheet } from 'react-native';

import { createStackNavigator } from '@react-navigation/stack';

import * as constants from 'src/constants';
import { HeaderIcon } from 'src/components';
import { useExtendedTheme } from 'src/hooks';
import { AuthPromptStackParamList } from 'src/navigation';

import {
  ForgotPasswordScreen,
  LoginScreen,
  RegisterScreen,
  StartScreen,
  TermsAndConditionsScreen,
} from './screens';

const AuthPromptStack = createStackNavigator<AuthPromptStackParamList>();

export default function AuthPromptNavigator() {
  const { colors } = useExtendedTheme();
  return (
    <AuthPromptStack.Navigator
      initialRouteName="AuthStart"
      screenOptions={{
        detachPreviousScreen: false,
        headerTintColor: colors.text,
        headerBackTitleVisible: false,
        headerTitleAllowFontScaling: false,
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
        headerLeftContainerStyle: {
          paddingLeft: constants.layout.defaultScreenMargins.horizontal,
        },
        cardStyle: {
          backgroundColor: colors.card,
        },
      }}>
      <AuthPromptStack.Group
        screenOptions={{
          headerTransparent: true,
          headerTitleContainerStyle: {
            opacity: 0,
          },
          headerLeft: props => (
            <HeaderIcon.Back
              {...props}
              style={[
                styles.headerLeftIcon,
                { backgroundColor: colors.captionDisabled },
              ]}
            />
          ),
        }}>
        <AuthPromptStack.Screen
          name="AuthStart"
          component={StartScreen}
          options={{
            headerLeft: props => (
              <HeaderIcon.Close
                {...props}
                style={[
                  styles.headerLeftIcon,
                  { backgroundColor: colors.captionDisabled },
                ]}
              />
            ),
          }}
        />
        <AuthPromptStack.Screen name="Login" component={LoginScreen} />
        <AuthPromptStack.Screen name="Register" component={RegisterScreen} />
        <AuthPromptStack.Screen
          name="ForgotPassword"
          component={ForgotPasswordScreen}
        />
      </AuthPromptStack.Group>
      <AuthPromptStack.Screen
        name="TermsAndConditions"
        component={TermsAndConditionsScreen}
        options={{
          title: 'Terms & Conditions',
          headerLeft: props => <HeaderIcon.Back {...props} />,
        }}
      />
    </AuthPromptStack.Navigator>
  );
}

const styles = StyleSheet.create({
  headerLeftIcon: {
    borderRadius: 20,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
