import React from 'react';
import { Alert, Linking, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
} from '@react-navigation/drawer';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as authSlice from 'src/features/authentication/auth-slice';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { ProfileId } from 'src/models';
import { RootStackNavigationProp, RootStackParamList } from 'src/navigation';

import Spacer from './Spacer';

const AVATAR_DIAMETER = 125;
const DRAWER_ITEM_ICON_COLOR = constants.color.black;
const DRAWER_ITEM_TEXT_COLOR = constants.color.black;

type AppDrawerItemProps = {
  label: string;
  iconName: string;
  tintColor?: string;
  onPress: () => void;
};

const AppDrawerItem = ({
  label,
  iconName,
  tintColor,
  onPress,
}: AppDrawerItemProps) => (
  <DrawerItem
    pressColor={constants.color.gray200}
    label={() => (
      <Text
        numberOfLines={1}
        style={[
          constants.font.medium,
          { color: tintColor ?? DRAWER_ITEM_TEXT_COLOR, marginLeft: -8 },
        ]}>
        {label}
      </Text>
    )}
    icon={({ size }) => (
      <Icon
        name={iconName}
        size={size}
        color={tintColor ?? DRAWER_ITEM_ICON_COLOR}
        style={{ paddingLeft: constants.layout.spacing.md }}
      />
    )}
    onPress={onPress}
    // style={{ paddingLeft: constants.layout.spacing.md }}
  />
);

const Divider = () => (
  <View
    style={{
      borderBottomWidth: 1,
      borderColor: constants.color.gray100,
      marginVertical: constants.layout.spacing.sm,
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
  const profile = useAppSelector(state =>
    profilesSlice.selectProfileById(state, profileId),
  );

  const handleNavigation = (screen: keyof RootStackParamList) => {
    navigation.closeDrawer();
    navigation.getParent<RootStackNavigationProp>().navigate(screen);
  };

  const handleSendFeedback = async () => {
    const subject = `Feedback for Discovrr v${constants.values.APP_VERSION}`;
    const body = `Hi Discovrr Team, I've been using your app and would like to share some feedback to you.`;
    const address = 'milos@discovrr.com';
    const link = `mailto:${address}?subject=${subject}&body=${body}`;

    const errorMessage =
      `Please send your feedback to ${address} instead. We'll get back to ` +
      `you shortly.\n\nThank you for considering sending us feedback.`;

    const canOpen = await Linking.canOpenURL(link);

    if (!canOpen) {
      Alert.alert(
        'Cannot Open Link',
        "Looks like your device doesn't support email links. " + errorMessage,
      );
      return;
    }

    try {
      await Linking.openURL(link);
    } catch (error) {
      Alert.alert(
        'Cannot Open Link',
        "We couldn't open this link for you. " + errorMessage,
      );
    }
  };

  const handleLogOut = () => {
    const commitLogOut = async () => {
      try {
        console.log($FUNC, 'Signing out...');
        await dispatch(authSlice.signOut()).unwrap();
      } catch (error) {
        console.error($FUNC, 'Failed to log out user:', error);
        throw error;
      }
    };

    navigation.closeDrawer();
    Alert.alert(
      'Are you sure you want to sign out?',
      'You will need to sign in again.',
      [
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            commitLogOut().catch(error => {
              console.error($FUNC, 'Failed to sign out:', error);
              Alert.alert(
                'Something went wrong',
                "We weren't able to sign you out right now. Please try again later.",
              );
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  return (
    <DrawerContentScrollView {...props}>
      <View style={{ padding: constants.layout.spacing.lg }}>
        <TouchableOpacity
          activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
          onPress={() => {
            if (profile) {
              handleNavigation('ProfileSettings');
            } else {
              utilities.alertSomethingWentWrong();
              navigation.closeDrawer();
            }
          }}>
          <View style={{ alignItems: 'center' }}>
            <FastImage
              source={
                profile?.avatar
                  ? { uri: profile.avatar.url }
                  : constants.media.DEFAULT_AVATAR
              }
              resizeMode="cover"
              style={{
                width: AVATAR_DIAMETER,
                height: AVATAR_DIAMETER,
                borderRadius: AVATAR_DIAMETER / 2,
                backgroundColor: constants.color.placeholder,
              }}
            />
            <Spacer.Vertical value="lg" />
            <Text
              numberOfLines={1}
              style={[constants.font.extraLargeBold, { textAlign: 'center' }]}>
              {profile?.displayName || 'Anonymous'}
            </Text>
            <Spacer.Vertical value="xs" />
            <Text
              numberOfLines={1}
              style={[
                constants.font.medium,
                { color: constants.color.gray500, textAlign: 'center' },
              ]}>
              @{profile?.username || 'anonymous'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <Divider />

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
        label="Send Us Feedback"
        iconName="chatbubbles-outline"
        onPress={handleSendFeedback}
      />

      <Divider />

      <AppDrawerItem
        label="Sign Out"
        iconName="log-out-outline"
        tintColor={constants.color.red500}
        onPress={handleLogOut}
      />

      <Divider />
    </DrawerContentScrollView>
  );
}
