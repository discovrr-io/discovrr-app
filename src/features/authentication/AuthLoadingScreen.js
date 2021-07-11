import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';

import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

import AsyncStorage from '@react-native-community/async-storage';
import OneSignal from 'react-native-onesignal';
import RNBootSplash from 'react-native-bootsplash';

import AppDrawer from '../../components/AppDrawer';
import GroundZero from '../../GroundZero';
import { colors } from '../../constants';

import LoginScreen from './LoginScreen';
import TermsAndConditions from './TermsAndConditions';

const Parse = require('parse/react-native');

Parse.setAsyncStorage(AsyncStorage);
Parse.User.enableUnsafeCurrentUser();
Parse.initialize('discovrrServer');
Parse.serverURL = 'https://discovrr-uat.herokuapp.com/discovrrServer'; // production

const AuthStack = createStackNavigator();
const MainDrawer = createDrawerNavigator();

async function setUpOneSignal() {
  OneSignal.setAppId('c20ba65b-d412-4a82-8cc4-df3ab545c0b1');
  OneSignal.setLogLevel(6, 0);
  OneSignal.setLocationShared(false);
  OneSignal.setRequiresUserPrivacyConsent(false);
  setUpOneSignalHandlers();
}

function setUpOneSignalHandlers() {
  OneSignal.promptForPushNotificationsWithUserResponse((response) => {
    console.log('[OneSignal] Permission to push notifications:', response);
  });

  OneSignal.setNotificationWillShowInForegroundHandler((event) => {
    console.log('[OneSignal] Notification will show in foreground:', event);
  });

  OneSignal.setNotificationOpenedHandler((notification) => {
    console.log('[OneSignal] Notification opened:', notification);
  });

  OneSignal.setInAppMessageClickHandler((event) => {
    console.log('[OneSignal] In-app message clicked:', event);
  });

  OneSignal.addPermissionObserver((event) => {
    console.log('[OneSignal] Permission changed:', event);
  });
}

/**
 * @param {import('../../models').User} user
 */
function sendOneSignalTags(user) {
  const { id: profileId, email, fullName, isVendor } = user.profile;

  if (profileId && email) {
    console.log('[OneSignal] Sending OneSignal tags...');
    OneSignal.sendTags({
      email,
      fullName,
      isVendor,
    });

    console.log('[OneSignal] Setting external user id...');
    OneSignal.setExternalUserId(profileId, (results) => {
      console.log('[OneSignal] Result of setting external id:', results);
    });
  } else {
    console.warn('One of the following required fields is not defined:', {
      profileId: profileId,
      email: email,
    });
  }
}

export default function AuthLoadingScreen() {
  /** @type {import('./authSlice').AuthState} */
  const { isAuthenticated, isFirstLogin, user } = useSelector(
    (state) => state.auth,
  );

  console.log('[AuthLoadingScreen] isAuthenticated?', isAuthenticated);

  useEffect(() => {
    RNBootSplash.hide({ duration: 250 });
    console.log('[AuthLoadingScreen] Will set up OneSignal...');
    setUpOneSignal();
  }, []);

  useEffect(() => {
    if (isFirstLogin && !!user) {
      console.log('[AuthLoadingScreen] Will send OneSignal tags...');
      sendOneSignalTags(user);
    }
  }, [isFirstLogin]);

  return isAuthenticated ? (
    <MainDrawer.Navigator
      drawerType="slide"
      drawerContent={(props) => <AppDrawer {...props} />}>
      <MainDrawer.Screen name="GroundZero" component={GroundZero} />
    </MainDrawer.Navigator>
  ) : (
    <AuthStack.Navigator>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="TermsAndConditions"
        component={TermsAndConditions}
        options={{
          title: 'Terms & Conditions',
          headerBackTitleVisible: false,
          headerTintColor: colors.black,
        }}
      />
    </AuthStack.Navigator>
  );
}
