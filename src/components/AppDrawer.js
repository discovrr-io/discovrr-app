import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSelector } from 'react-redux';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';

import { colors, typography, values } from '../constants';

const AVATAR_DIAMETER = 100;
const DEFAULT_ACTIVE_OPACITY = 0.8;

const Divider = () => (
  <View
    style={{
      borderBottomWidth: 1,
      borderColor: colors.gray100,
      marginVertical: values.spacing.sm,
    }}
  />
);

export default function AppDrawer({ ...props }) {
  /** @type {import('../features/authentication/authSlice').AuthState} */
  const authState = useSelector((state) => state.auth);
  if (!authState.user) {
    console.warn('[AppDrawer] No user found in store');
    return null;
  }

  const { profile } = authState.user;

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: values.spacing.lg }}>
        <TouchableOpacity
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={() => {}}>
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
              style={{
                fontSize: typography.size.h4,
                fontWeight: '700',
                paddingTop: values.spacing.lg,
                textAlign: 'center',
              }}>
              {profile.fullName}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <Divider />
      <DrawerItem
        label="Search Location"
        icon={({ color, size }) => (
          <Icon name="location-pin" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <DrawerItem
        label="Search Location"
        icon={({ color, size }) => (
          <Icon name="notifications" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <DrawerItem
        label="Profile Settings"
        icon={({ color, size }) => (
          <Icon name="settings" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <DrawerItem
        label="Your Shopping"
        icon={({ color, size }) => (
          <Icon name="shopping-bag" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <DrawerItem
        label="Account Settings"
        icon={({ color, size }) => (
          <Icon name="person" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <Divider />
      <DrawerItem
        label="Logout"
        icon={({ color, size }) => (
          <Icon name="logout" size={size} color={color} />
        )}
        onPress={() => {}}
      />
      <Divider />
    </DrawerContentScrollView>
  );
}
