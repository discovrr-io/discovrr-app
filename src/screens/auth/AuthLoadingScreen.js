import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';

import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { connect } from 'react-redux';

import AsyncStorage from '@react-native-community/async-storage';
import OneSignal from 'react-native-onesignal';

import * as actions from '../../utilities/Actions';
import LoginScreen from './LoginScreen';
import GroundZero from '../../GroundZero';
import AppDrawer from '../../components/AppDrawer';

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

  const { userId: currentPlayerId } = await OneSignal.getDeviceState();
  await setOneSignalPlayerId(currentPlayerId);
  sendOneSignalTags();
  setUpOneSignalHandlers();
}

async function setOneSignalPlayerId(currentPlayerId) {
  try {
    const Profile = Parse.Object.extend('Profile');
    const profilePointer = new Profile();
    profilePointer.id = profileId;

    const oneSignalPlayerIds = profilePointer.get('oneSignalPlayerIds') ?? [];

    if (!oneSignalPlayerIds.includes(currentPlayerId)) {
      profilePointer.set('oneSignalPlayerIds', [
        ...oneSignalPlayerIds,
        currentPlayerId,
      ]);
      await profilePointer.save();
    }
  } catch (error) {
    console.error(
      `Failed to set oneSignalPlayerIds for profile '${profileId}':`,
      error,
    );
  }
}

function setUpOneSignalHandlers() {
  OneSignal.promptForPushNotificationsWithUserResponse((response) => {
    console.log('[OneSignal]: Permission to push notifications:', response);
  });

  OneSignal.setNotificationWillShowInForegroundHandler((event) => {
    console.log('[OneSignal]: Notification will show in foreground:', event);
  });

  OneSignal.setNotificationOpenedHandler((notification) => {
    console.log('[OneSignal]: Notification opened:', notification);
  });

  OneSignal.setInAppMessageClickHandler((event) => {
    console.log('[OneSignal]: In-app message clicked:', event);
  });

  OneSignal.addPermissionObserver((event) => {
    console.log('[OneSignal]: Permission changed:', event);
  });
}

function sendOneSignalTags() {
  if (userId && profileId && email) {
    // We'll send both userId and profileId for convenience
    OneSignal.sendTags({
      userId,
      profileId,
      email,
      name,
      locationPreference,
    });

    OneSignal.setExternalUserId(userId, (results) => {
      console.log('[OneSignal]: Result of setting external id:', results);
    });
  } else {
    console.warn('One of the following required fields is not defined:', {
      userId: userId,
      profileId: profileId,
      email: email,
    });
  }
}

function AuthLoadingScreen({ isAuthenticated }) {
  console.log('[AuthLoadingScreen] isAuthenticated:', isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) setUpOneSignal();
  }, []);

  return isAuthenticated ? (
    <>
      <MainDrawer.Navigator drawerContent={(props) => <AppDrawer {...props} />}>
        <MainDrawer.Screen name="GroundZero" component={GroundZero} />
      </MainDrawer.Navigator>
      <StatusBar animated barStyle="dark-content" />
    </>
  ) : (
    <AuthStack.Navigator headerMode="none">
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

const mapStateToProps = (state) => {
  const { userState } = state;

  return {
    userDetails: userState.userDetails,
    isAuthenticated: userState.isLoggedIn === 'signedIn',
  };
};

export default connect(mapStateToProps)(AuthLoadingScreen);
