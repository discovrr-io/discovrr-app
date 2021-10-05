import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import OneSignal from 'react-native-onesignal';

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';

import { color, font, layout } from 'src/constants';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';
import { signOut } from 'src/features/authentication/authSlice';
import { selectProfileById } from 'src/features/profiles/profilesSlice';
import { useAppDispatch, useAppSelector } from 'src/hooks';

import { RootStackNavigationProp, RootStackParamList } from 'src/navigation';
import { ProfileId } from 'src/models';
import { alertSomethingWentWrong } from 'src/utilities';

const AVATAR_DIAMETER = 125;
const DRAWER_ITEM_ICON_COLOR = color.black;
const DRAWER_ITEM_TEXT_COLOR = color.black;

type AppDrawerItemProps = {
  label: string;
  iconName: string;
  onPress: () => void;
};

const AppDrawerItem = ({ label, iconName, onPress }: AppDrawerItemProps) => (
  <DrawerItem
    pressColor={color.gray200}
    label={() => (
      <Text
        numberOfLines={1}
        style={[
          font.medium,
          { color: DRAWER_ITEM_TEXT_COLOR, marginLeft: -8 },
        ]}>
        {label}
      </Text>
    )}
    icon={({ size }) => (
      <Icon name={iconName} size={size} color={DRAWER_ITEM_ICON_COLOR} />
    )}
    onPress={onPress}
    style={{ paddingLeft: layout.spacing.md }}
  />
);

const Divider = () => (
  <View
    style={{
      borderBottomWidth: 1,
      borderColor: color.gray100,
      marginVertical: layout.spacing.sm,
    }}
  />
);

type AppDrawerProps = DrawerContentComponentProps;

export default function AppDrawerWrapper(props: AppDrawerProps) {
  const $FUNC = '[AppDrawerWrapper]';
  const authState = useAppSelector(state => state.auth);

  if (!authState.user) {
    console.error($FUNC, 'No user found in store');
    return null;
  }

  return <AppDrawer profileId={authState.user.profileId} {...props} />;
}

function AppDrawer(props: AppDrawerProps & { profileId: ProfileId }) {
  const $FUNC = '[AppDrawer]';
  const { profileId } = props;

  const dispatch = useAppDispatch();
  const navigation = props.navigation;
  const profile = useAppSelector(state => selectProfileById(state, profileId));

  const handleNavigation = (screen: keyof RootStackParamList) => {
    navigation.closeDrawer();
    navigation.getParent<RootStackNavigationProp>().navigate(screen);
  };

  const handleLogOut = () => {
    const commitLogOut = async () => {
      try {
        await dispatch(signOut()).unwrap();
        console.log($FUNC, 'Removing OneSignal external user ID...');
        OneSignal.removeExternalUserId(results => {
          console.log($FUNC, 'Successfully removed external user id:', results);
        });
      } catch (error) {
        console.error($FUNC, 'Failed to log out user:', error);
        throw error;
      }
    };

    navigation.closeDrawer();
    Alert.alert(
      'Are you sure you want to log out?',
      'You will need to sign in again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: () => {
            commitLogOut().catch(error => {
              console.error($FUNC, 'Failed to sign out:', error);
              Alert.alert(
                'Something went wrong',
                "We weren't able to sign you out right now. \
                   Please try again later.",
              );
            });
          },
        },
      ],
    );
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: layout.spacing.lg }}>
        <TouchableOpacity
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={() => {
            if (profile) {
              handleNavigation('ProfileSettings');
            } else {
              alertSomethingWentWrong();
              navigation.closeDrawer();
            }
          }}>
          <View style={{ alignItems: 'center' }}>
            <FastImage
              source={
                profile?.avatar ? { uri: profile.avatar.url } : DEFAULT_AVATAR
              }
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
                font.extraLargeBold,
                {
                  paddingTop: layout.spacing.lg,
                  textAlign: 'center',
                },
              ]}>
              {profile?.displayName || 'Anonymous'}
            </Text>
            <Text
              numberOfLines={1}
              style={[
                font.medium,
                {
                  color: color.gray500,
                  paddingTop: layout.spacing.xs,
                  textAlign: 'center',
                },
              ]}>
              @{profile?.username || 'anonymous'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Divider />

      {/* <AppDrawerItem
        label="Notifications"
        iconName="notifications-outline"
        onPress={() => handleNavigation('Notifications')}
      /> */}
      <AppDrawerItem
        label="My Shopping"
        iconName="cart-outline"
        onPress={() => handleNavigation('MyShopping')}
      />
      <AppDrawerItem
        label="Saved"
        iconName="bookmark-outline"
        onPress={() => handleNavigation('Saved')}
      />
      <AppDrawerItem
        label="Settings"
        iconName="settings-outline"
        onPress={() => handleNavigation('MainSettings')}
      />

      <Divider />

      <AppDrawerItem
        label="Log Out"
        iconName="log-out-outline"
        onPress={handleLogOut}
      />

      <Divider />
    </DrawerContentScrollView>
  );
}
