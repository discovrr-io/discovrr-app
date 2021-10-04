import React, { useCallback, useRef } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import DeviceInfo from 'react-native-device-info';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import OneSignal from 'react-native-onesignal';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';

import SearchLocationModal from './bottomSheets/SearchLocationModal';
import { useAppDispatch, useAppSelector } from '../hooks';
import { FEATURE_UNAVAILABLE } from '../constants/strings';
import { selectProfileById } from '../features/profiles/profilesSlice';
import {
  selectCurrentUserProfileId,
  signOut,
} from '../features/authentication/authSlice';

import {
  DEFAULT_ACTIVE_OPACITY,
  colors,
  typography,
  values,
} from '../constants';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

const AVATAR_DIAMETER = 125;

const DRAWER_ITEM_ICON_COLOR = colors.black;
const DRAWER_ITEM_TEXT_COLOR = colors.black;

const Divider = () => (
  <View
    style={{
      borderBottomWidth: 1,
      borderColor: colors.gray100,
      marginVertical: values.spacing.sm,
    }}
  />
);

const AppDrawerItem = ({ label, iconName, onPress }) => (
  <DrawerItem
    label={() => <Text style={{ color: DRAWER_ITEM_TEXT_COLOR }}>{label}</Text>}
    icon={({ size }) => (
      <Icon name={iconName} size={size} color={DRAWER_ITEM_ICON_COLOR} />
    )}
    onPress={onPress}
    style={appDrawerStyles.drawerItem}
  />
);

export default function AppDrawer({ navigation, ...props }) {
  const $FUNC = '[AppDrawer]';
  const dispatch = useAppDispatch();

  const bottomSheetModalRef = useRef<BottomSheetModal | null>(null);

  const authState = useAppSelector((state) => state.auth);
  if (!authState.user) {
    console.error($FUNC, 'No user found in store');
    return null;
  }

  const profileId = useAppSelector(selectCurrentUserProfileId);
  const profile = useAppSelector((state) =>
    selectProfileById(state, profileId),
  );

  if (!profile) console.warn($FUNC, `Profile '${profileId}' is undefined`);

  const handleShowModal = useCallback(() => {
    bottomSheetModalRef.current.present();
  }, []);

  const handleLogOut = () => {
    navigation.closeDrawer();

    const signOutUser = async () => {
      try {
        await dispatch(signOut({})).unwrap();
        console.log($FUNC, 'Removing OneSignal external user ID...');
        OneSignal.removeExternalUserId((results) => {
          console.log($FUNC, 'Successfully removed external user id:', results);
        });
      } catch (error) {
        console.error($FUNC, 'Failed to log out user:', error);
        throw error;
      }
    };

    Alert.alert(
      'Are you sure you want to log out?',
      'You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            signOutUser()
              .then(() => console.info($FUNC, 'Successfully logged out'))
              .catch((error) => {
                console.error($FUNC, 'Failed to sign out:', error);
                Alert.alert(
                  'Something went wrong',
                  "We weren't able to sign you out right now. Please try again later.",
                );
              });
          },
        },
      ],
    );
  };

  const alertUnavailableFeature = () => {
    Alert.alert(FEATURE_UNAVAILABLE.title, FEATURE_UNAVAILABLE.message);
  };

  // TODO: Add version code
  return (
    <View style={{ flex: 1 }}>
      <DrawerContentScrollView {...props}>
        <View style={{ padding: values.spacing.lg }}>
          <TouchableOpacity
            activeOpacity={DEFAULT_ACTIVE_OPACITY}
            onPress={() => {
              navigation.navigate('UserProfileScreen', {
                profileId: profile?.id,
                profileName: 'My Profile',
              });
            }}>
            <View style={{ alignItems: 'center' }}>
              <FastImage
                source={profile?.avatar}
                resizeMode="cover"
                style={{
                  width: AVATAR_DIAMETER,
                  height: AVATAR_DIAMETER,
                  borderRadius: AVATAR_DIAMETER / 2,
                  backgroundColor: colors.gray100,
                }}
              />
              <Text
                numberOfLines={1}
                style={{
                  fontSize: typography.size.h4,
                  fontWeight: '700',
                  textAlign: 'center',
                  paddingTop: values.spacing.lg,
                }}>
                {profile?.fullName ?? 'Undefined'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Divider />

        <AppDrawerItem
          label="Search Location"
          iconName="location-pin"
          onPress={handleShowModal}
        />
        <AppDrawerItem
          label="Notifications"
          iconName="notifications"
          onPress={alertUnavailableFeature}
        />
        <AppDrawerItem
          label="Profile Settings"
          iconName="person"
          onPress={() => {
            navigation.navigate('ProfileEditScreen', { profile: profile?.id });
          }}
        />
        <AppDrawerItem
          label="My Shopping"
          iconName="shopping-bag"
          onPress={alertUnavailableFeature}
        />
        <AppDrawerItem
          label="Account Settings"
          iconName="settings"
          // onPress={() => navigation.navigate('AccountSettingsScreen')}
          onPress={alertUnavailableFeature}
        />

        <Divider />

        <AppDrawerItem
          label="Log Out"
          iconName="logout"
          onPress={handleLogOut}
        />

        <Divider />
      </DrawerContentScrollView>
      {/* Avoids the bottom edge on newer iOS devices */}
      <SafeAreaView>
        <Text
          style={{
            color: colors.gray700,
            textAlign: 'center',
            padding: values.spacing.lg,
          }}>
          Discovrr v{DeviceInfo.getVersion()} (Build 2021.10.03.0)
        </Text>
      </SafeAreaView>

      <SearchLocationModal ref={bottomSheetModalRef} />
    </View>
  );
}

const appDrawerStyles = StyleSheet.create({
  drawerItem: {
    paddingLeft: values.spacing.lg,
  },
});