import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
// import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { useDispatch, useSelector } from 'react-redux';

import { AuthApi } from '../api';
import { signOut } from '../features/authentication/authSlice';
import {
  DEFAULT_ACTIVE_OPACITY,
  colors,
  typography,
  values,
} from '../constants';

const AVATAR_DIAMETER = 125;

const Divider = () => (
  <View
    style={{
      borderBottomWidth: 1,
      borderColor: colors.gray100,
      marginVertical: values.spacing.sm,
    }}
  />
);

export default function AppDrawer({ navigation, ...props }) {
  const dispatch = useDispatch();

  const authState = useSelector((state) => state.auth);
  if (!authState.user) {
    console.error('[AppDrawer] No user found in store');
    return null;
  }

  const { profile } = authState.user;

  const handleLogOut = () => {
    navigation.closeDrawer();

    const signOutUser = async () => {
      try {
        AuthApi.signOut();
      } catch (error) {
        console.error('[AppDrawer] Failed to log out user:', error);
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
            signOutUser().then(() => {
              console.log('[AppDrawer] Dispatching `auth/signOut` action...');
              dispatch(signOut());
            });
          },
        },
      ],
    );
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: values.spacing.lg }}>
        <TouchableOpacity
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={() => {
            navigation.navigate('Profile', { profileId: profile.id });
          }}>
          <View style={{ alignItems: 'center' }}>
            <FastImage
              source={profile.avatar}
              resizeMode="cover"
              style={{
                width: AVATAR_DIAMETER,
                height: AVATAR_DIAMETER,
                borderRadius: AVATAR_DIAMETER / 2,
              }}
            />
            <Text
              numberOfLines={1}
              style={[
                typography.extraLargeBold,
                {
                  paddingTop: values.spacing.lg,
                  textAlign: 'center',
                },
              ]}>
              {profile.fullName}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <Divider />
      {/* <DrawerItem
        label="Search Location"
        icon={({ color, size }) => (
          <Icon name="location-pin" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <DrawerItem
        label="Notifications"
        icon={({ color, size }) => (
          <Icon name="notifications" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <DrawerItem
        label="Profile Settings"
        icon={({ color, size }) => (
          <Icon name="person" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <DrawerItem
        label="My Shopping"
        icon={({ color, size }) => (
          <Icon name="shopping-bag" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <DrawerItem
        label="Account Settings"
        icon={({ color, size }) => (
          <Icon name="settings" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <Divider />
      <DrawerItem
        label="Log Out"
        icon={({ color, size }) => (
          <Icon name="logout" size={size} color={color} />
        )}
        onPress={handleLogOut}
      />
      <Divider /> */}
    </DrawerContentScrollView>
  );
}
