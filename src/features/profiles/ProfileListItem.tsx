import * as React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import * as constants from 'src/constants';
import { AsyncGate, Spacer } from 'src/components';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { Profile, ProfileId } from 'src/models';
import { RootStackNavigationProp } from 'src/navigation';

import { useIsMyProfile, useProfile } from './hooks';
import { useExtendedTheme } from 'src/hooks';

const AVATAR_DIAMETER = 45;

type ProfileListItemProps = {
  profileId: ProfileId;
};

export default function ProfileListItem(props: ProfileListItemProps) {
  const profileData = useProfile(props.profileId);
  return (
    <AsyncGate
      data={profileData}
      onPending={() => <LoadedProfileListItem.Pending />}
      onFulfilled={profile => {
        if (!profile) return null;
        return <LoadedProfileListItem profile={profile} />;
      }}
    />
  );
}

type InnerProfileListItemProps = {
  profile: Profile;
};

const LoadedProfileListItem = (props: InnerProfileListItemProps) => {
  const { profile } = props;
  const { colors } = useExtendedTheme();

  const navigation = useNavigation<RootStackNavigationProp>();
  const isMyProfile = useIsMyProfile(profile.profileId);

  const handlePressProfile = () => {
    navigation.push('ProfileDetails', {
      profileIdOrUsername: profile.profileId,
    });
  };

  return (
    <TouchableHighlight
      underlayColor={colors.highlight}
      onPress={handlePressProfile}>
      <View style={profileListItemStyles.container}>
        <FastImage
          source={profile.avatar ? { uri: profile.avatar.url } : DEFAULT_AVATAR}
          style={[
            profileListItemStyles.avatar,
            { backgroundColor: colors.placeholder },
          ]}
        />
        <View style={profileListItemStyles.innerContainer}>
          <Text
            numberOfLines={1}
            style={[
              isMyProfile
                ? [constants.font.mediumBold, { color: constants.color.accent }]
                : [constants.font.medium, { color: colors.text }],
            ]}>
            {isMyProfile ? 'You' : profile.__publicName}
          </Text>
          <Spacer.Vertical value={constants.layout.spacing.xs} />
          <Text
            numberOfLines={2}
            style={[constants.font.small, { color: colors.text }]}>
            {profile.biography || 'No biography'}
          </Text>
        </View>
        <Icon name="chevron-forward" size={24} color={colors.text} />
      </View>
    </TouchableHighlight>
  );
};

LoadedProfileListItem.Pending = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors } = useExtendedTheme();
  return (
    <View style={profileListItemStyles.container}>
      <View
        style={[
          profileListItemStyles.avatar,
          { backgroundColor: colors.placeholder },
        ]}
      />
      <View style={profileListItemStyles.innerContainer}>
        <View
          style={{
            height: 19,
            width: '45%',
            backgroundColor: colors.placeholder,
          }}
        />
        <Spacer.Vertical value={constants.layout.spacing.xs} />
        <View
          style={{
            height: 17,
            width: '75%',
            backgroundColor: colors.placeholder,
          }}
        />
      </View>
    </View>
  );
};

const profileListItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: constants.layout.spacing.md,
    paddingHorizontal: constants.layout.spacing.md,
  },
  avatar: {
    width: AVATAR_DIAMETER,
    height: AVATAR_DIAMETER,
    borderRadius: AVATAR_DIAMETER / 2,
  },
  innerContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginHorizontal: constants.layout.spacing.md,
  },
});
