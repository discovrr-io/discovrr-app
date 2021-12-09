import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';

import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
  DrawerItem,
  useDrawerStatus,
} from '@react-navigation/drawer';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as authSlice from 'src/features/authentication/auth-slice';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import { useAppDispatch, useAppSelector, useExtendedTheme } from 'src/hooks';
import { useProfile } from 'src/features/profiles/hooks';
import { Profile, ProfileId } from 'src/models';
import { RootStackNavigationProp, RootStackParamList } from 'src/navigation';

import AsyncGate from './AsyncGate';
import Spacer from './Spacer';

const AVATAR_DIAMETER = 125;
const ROLE_CHIP_HIT_SLOP_INSET = 25;

type AppDrawerItemProps = {
  label: string;
  iconName: string;
  tintColor?: string;
  onPress: () => void;
};

function AppDrawerItem(props: AppDrawerItemProps) {
  const { label, iconName, tintColor, onPress } = props;
  const { colors } = useExtendedTheme();

  return (
    <DrawerItem
      pressColor={colors.highlight}
      label={() => (
        <Text
          numberOfLines={1}
          style={[
            constants.font.medium,
            { color: tintColor || colors.text, marginLeft: -8 },
          ]}>
          {label}
        </Text>
      )}
      icon={({ size }) => (
        <Icon
          name={iconName}
          size={size}
          color={tintColor ?? colors.text}
          style={{ paddingLeft: constants.layout.spacing.md }}
        />
      )}
      onPress={onPress}
    />
  );
}

function Divider() {
  const { colors } = useExtendedTheme();
  return (
    <View
      style={{
        borderColor: colors.border,
        marginVertical: constants.layout.spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
      }}
    />
  );
}

function RoleChip(props: { label: string }) {
  const [chipHeight, setChipHeight] = React.useState(0);

  const chipColor = React.useMemo(() => {
    switch (props.label) {
      case 'administrator':
        return constants.color.red500;
      case 'moderator':
        return constants.color.orange500;
      case 'verified-vendor':
        return constants.color.teal500;
      case 'vendor':
        return constants.color.gray500;
      case 'banned':
        return constants.color.red700;
      default:
        return constants.color.gray500;
    }
  }, [props.label]);

  const humanReadableRoleLabel = React.useMemo(() => {
    return (props.label === 'vendor' ? 'unverified-vendor' : props.label)
      .replace('-', ' ')
      .replace('vendor', 'maker');
  }, [props.label]);

  const handlePressChip = React.useCallback(() => {
    let title: string | undefined = undefined;
    let message: string | undefined = undefined;

    switch (props.label) {
      case 'administrator':
        title = "You're an Administrator";
        message =
          'You have the highest level of power over the content and users of Discovrr.';
        break;
      case 'moderator':
        title = "You're a Moderator";
        message =
          'You have been granted the ability to moderate the content of Discovrr to make it a safe and open place for everyone.';
        break;
      case 'verified-vendor':
        title = "You're a Verified Maker";
        message = `You may upload as many products as you desire. As a loyal partner, we'll handle the transactions for you.`;
        break;
      case 'vendor':
        title = "You're an Unverified Maker";
        message = `Your products will remain hidden from the public until you're verified.\n\nTo be verified, start by uploading a new product. We'll let you know of the outcome shortly after.`;
        break;
      case 'banned':
        title = "You've Been Banned";
        message = `We believe you broke our terms and thus we have removed all privileges from you. Please contact us for more information.`;
        break;
    }

    if (title && message) Alert.alert(title, message);
  }, [props.label]);

  return (
    <TouchableHighlight
      underlayColor={chipColor + utilities.percentToHex(0.5)}
      onLayout={({ nativeEvent }) => setChipHeight(nativeEvent.layout.height)}
      onPress={handlePressChip}
      hitSlop={{
        top: ROLE_CHIP_HIT_SLOP_INSET,
        bottom: ROLE_CHIP_HIT_SLOP_INSET,
        left: ROLE_CHIP_HIT_SLOP_INSET,
        right: ROLE_CHIP_HIT_SLOP_INSET,
      }}
      style={{
        paddingVertical: constants.layout.spacing.xs,
        paddingHorizontal: constants.layout.spacing.md,
        backgroundColor: chipColor + utilities.percentToHex(0.15),
        borderWidth: 1,
        borderColor: chipColor,
        borderRadius: chipHeight / 2,
      }}>
      <Text
        numberOfLines={1}
        style={[constants.font.smallBold, { color: chipColor }]}>
        {humanReadableRoleLabel}
      </Text>
    </TouchableHighlight>
  );
}

type AppDrawerProps = DrawerContentComponentProps;

export default function AppDrawer(props: AppDrawerProps) {
  const $FUNC = '[AppDrawer]';

  const dispatch = useAppDispatch();
  const profileId = useAppSelector(state => state.auth.user?.profileId);
  const { colors } = useExtendedTheme();

  const handleNavigation = (screen: keyof RootStackParamList) => {
    props.navigation.closeDrawer();
    props.navigation.getParent<RootStackNavigationProp>().navigate(screen);
  };

  const handleSendFeedback = async () => {
    const subject = `Feedback for Discovrr v${constants.values.APP_VERSION}`;
    const body = `Hi Discovrr Team, I've been using your app and would like to share some feedback to you.`;
    const address = 'milos@discovrr.app';
    const link = `mailto:${address}?subject=${subject}&body=${body}`;

    const errorMessage =
      `Please send your feedback to ${address} instead. We'll get back to ` +
      `you shortly.\n\nThank you for considering sending us feedback.`;

    if (!(await Linking.canOpenURL(link))) {
      Alert.alert(
        'Cannot Open Link',
        "Looks like your device doesn't support email links. " + errorMessage,
      );
      return;
    }

    try {
      await Linking.openURL(link);
    } catch (error) {
      console.warn($FUNC, 'Failed to open link:', error);
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

    props.navigation.closeDrawer();
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
    <DrawerContentScrollView
      {...props}
      style={{ backgroundColor: colors.card }}>
      <View style={{ padding: constants.layout.spacing.lg }}>
        <TouchableOpacity
          activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
          onPress={() => {
            if (profileId) {
              handleNavigation('ProfileSettings');
            } else {
              props.navigation
                .getParent<RootStackNavigationProp>()
                .navigate('AuthPrompt', { screen: 'AuthStart' });
            }
          }}>
          {profileId ? (
            <AppDrawerProfileDetails profileId={profileId} />
          ) : (
            <AppDrawerProfileDetails.Anonymous />
          )}
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

      {!!profileId && (
        <>
          <Divider />

          <AppDrawerItem
            label="Sign Out"
            iconName="log-out-outline"
            tintColor={constants.color.red500}
            onPress={handleLogOut}
          />
        </>
      )}

      <Divider />
    </DrawerContentScrollView>
  );
}

type AppDrawerProfileDetailsProps = {
  profileId: ProfileId;
};

const AppDrawerProfileDetails = (props: AppDrawerProfileDetailsProps) => {
  const dispatch = useAppDispatch();
  const drawerStatus = useDrawerStatus();
  const profileData = useProfile(props.profileId);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    async function fetchMyProfile() {
      const fetchProfileAction = profilesSlice.fetchProfileById({
        profileId: props.profileId,
        reload: true,
      });

      await new Promise<void>(resolve => {
        // iOS: Wait a bit to let the dark-overlay animation to complete
        timeout = setTimeout(async () => {
          try {
            await dispatch(fetchProfileAction).unwrap();
            resolve(undefined);
          } catch (error) {
            console.error('Failed to fetch profile:', error);
          }
        }, 500);
      });
    }

    if (drawerStatus === 'open') fetchMyProfile();

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [dispatch, drawerStatus, props.profileId]);

  return (
    <AsyncGate
      data={profileData}
      onPending={AppDrawerProfileDetails.Pending}
      onRejected={AppDrawerProfileDetails.Pending}
      onFulfilled={profile => {
        if (!profile) return <AppDrawerProfileDetails.Pending />;
        return <AppDrawerProfileDetails.Fulfilled profile={profile} />;
      }}
    />
  );
};

AppDrawerProfileDetails.Fulfilled = ({ profile }: { profile: Profile }) => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors } = useExtendedTheme();

  return (
    <View style={{ alignItems: 'center' }}>
      <FastImage
        resizeMode="cover"
        source={
          profile.avatar
            ? { uri: profile.avatar.url }
            : constants.media.DEFAULT_AVATAR
        }
        style={{
          aspectRatio: 1,
          width: AVATAR_DIAMETER,
          borderRadius: AVATAR_DIAMETER / 2,
          backgroundColor: colors.placeholder,
        }}
      />
      <Spacer.Vertical value="lg" />
      <Text
        numberOfLines={1}
        style={[
          constants.font.extraLargeBold,
          { textAlign: 'center', color: colors.text },
        ]}>
        {profile.__publicName || 'Anonymous'}
      </Text>
      <Spacer.Vertical value="xs" />
      <Text
        numberOfLines={1}
        style={[
          constants.font.medium,
          { color: constants.color.gray500, textAlign: 'center' },
        ]}>
        @{profile.username || 'anonymous'}
      </Text>
      {profile.highestRole && profile.highestRole !== 'user' && (
        <>
          <Spacer.Vertical value="md" />
          <RoleChip label={profile.highestRole} />
        </>
      )}
    </View>
  );
};

AppDrawerProfileDetails.Pending = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors } = useExtendedTheme();

  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ alignItems: 'center', justifyContent: 'center' }}>
        <FastImage
          source={{}}
          style={{
            aspectRatio: 1,
            width: AVATAR_DIAMETER,
            borderRadius: AVATAR_DIAMETER / 2,
            backgroundColor: colors.placeholder,
          }}
        />
        <ActivityIndicator
          size="small"
          color={constants.color.gray500}
          style={{ position: 'absolute' }}
        />
      </View>
      <Spacer.Vertical value="lg" />
      <View
        style={{
          height: 24,
          width: '50%',
          backgroundColor: colors.placeholder,
        }}
      />
      <Spacer.Vertical value="xs" />
      <View
        style={{
          height: 19,
          width: '25%',
          backgroundColor: colors.placeholder,
        }}
      />
    </View>
  );
};

AppDrawerProfileDetails.Anonymous = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors } = useExtendedTheme();

  return (
    <View style={{ alignItems: 'center' }}>
      <FastImage
        resizeMode="cover"
        source={constants.media.DEFAULT_AVATAR}
        style={{
          aspectRatio: 1,
          width: AVATAR_DIAMETER,
          borderRadius: AVATAR_DIAMETER / 2,
          backgroundColor: colors.placeholder,
        }}
      />
      <Spacer.Vertical value="lg" />
      <Text
        maxFontSizeMultiplier={1.2}
        style={[
          constants.font.extraLargeBold,
          { textAlign: 'center', color: colors.text },
        ]}>
        You&apos;re not signed in
      </Text>
      <Spacer.Vertical value="xs" />
      <Text
        maxFontSizeMultiplier={1.2}
        style={[
          constants.font.medium,
          { textAlign: 'center', color: colors.text },
        ]}>
        Tap here to sign in
      </Text>
    </View>
  );
};
