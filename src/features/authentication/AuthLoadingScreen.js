import React, { useEffect } from 'react';

import inAppMessaging from '@react-native-firebase/in-app-messaging';
import OneSignal from 'react-native-onesignal';
import RNBootSplash from 'react-native-bootsplash';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';

import AppDrawer from '../../components/AppDrawer';
import GroundZero from '../../GroundZero';
import { colors } from '../../constants';
import { fetchProfileById } from '../profiles/profilesSlice';
import { signOut } from './authSlice';

import LoginScreen from './LoginScreen';
import TermsAndConditions from './TermsAndConditions';

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
  const $FUNC = '[OneSignal]';

  OneSignal.promptForPushNotificationsWithUserResponse((response) => {
    console.log($FUNC, 'Permission to push notifications:', response);
  });

  OneSignal.setNotificationWillShowInForegroundHandler((event) => {
    console.log($FUNC, 'Notification will show in foreground:', event);
  });

  OneSignal.setNotificationOpenedHandler((notification) => {
    console.log($FUNC, 'Notification opened:', notification);
  });

  OneSignal.setInAppMessageClickHandler((event) => {
    console.log($FUNC, 'In-app message clicked:', event);
  });

  OneSignal.addPermissionObserver((event) => {
    console.log($FUNC, 'Permission changed:', event);
  });
}

/**
 * @param {import('../../models').Profile} profile
 */
function sendOneSignalTags(profile) {
  const $FUNC = '[AuthLoadingScreen.sendOneSignalTags]';
  const { id: profileId, email, fullName, isVendor } = profile;

  if (profileId && email) {
    console.log($FUNC, 'Sending OneSignal tags...');
    OneSignal.sendTags({
      email,
      fullName,
      isVendor,
    });

    console.log($FUNC, 'Setting external user id...');
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
  const $FUNC = '[AuthLoadingScreen]';
  const dispatch = useDispatch();

  /** @type {import('./authSlice').AuthState } */
  const { isAuthenticated, isFirstLogin, user } = useSelector(
    (state) => state.auth,
  );

  console.log($FUNC, 'Is authenticated?', isAuthenticated);

  useEffect(() => {
    RNBootSplash.hide({ duration: 250 });
    console.log($FUNC, 'Will set up OneSignal...');
    setUpOneSignal();
  }, []);

  useEffect(() => {
    (async () => {
      if (isAuthenticated) {
        try {
          console.log($FUNC, 'Enabling in app messages...');
          await inAppMessaging().setMessagesDisplaySuppressed(false);
        } catch (error) {
          console.error($FUNC, 'Failed to enable in app messages:', error);
        }
      }

      if (isFirstLogin && !!user) {
        try {
          console.log(
            $FUNC,
            `Fetching current user's profile (${user.profileId})...`,
          );
          /** @type {import('../../models').Profile} */
          const profile = await dispatch(
            fetchProfileById({ profileId: user.profileId, reload: true }),
          ).unwrap();

          console.log($FUNC, 'Will send OneSignal tags...');
          sendOneSignalTags(profile);
        } catch (error) {
          console.error(
            $FUNC,
            "Failed to fetch current user's profile:",
            error,
          );

          console.warn($FUNC, 'Aborting operation. Signing out...');
          // await dispatch(abortSignOut(error)).unwrap();
          dispatch(signOut())
            .unwrap()
            .catch((error) => console.warn('Ignored sign out error:', error));
        }
      }
    })();
  }, [isAuthenticated, isFirstLogin, user]);

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
