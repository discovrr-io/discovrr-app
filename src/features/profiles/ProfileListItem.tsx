import React from 'react';
import { StyleSheet, Text, TouchableHighlight, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

import { AsyncGate, Spacer } from 'src/components';
import { color, font, layout } from 'src/constants';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { Profile, ProfileId } from 'src/models';
import { RootStackNavigationProp } from 'src/navigation';

import { useIsMyProfile, useProfile } from './hooks';

const AVATAR_DIAMETER = 45;

type ProfileListItemProps = {
  profileId: ProfileId;
};

export default function ProfileListItem(props: ProfileListItemProps) {
  const profileData = useProfile(props.profileId);
  return (
    <AsyncGate
      data={profileData}
      onPending={() => <InnerProfileListItem.Pending />}
      onFulfilled={profile => {
        if (!profile) return null;
        return <InnerProfileListItem profile={profile} />;
      }}
    />
  );
}

type InnerProfileListItemProps = {
  profile: Profile;
};

const InnerProfileListItem = (props: InnerProfileListItemProps) => {
  const { profile } = props;
  const navigation = useNavigation<RootStackNavigationProp>();
  const isMyProfile = useIsMyProfile(profile.id);

  const handlePressProfile = () => {
    navigation.push('ProfileDetails', {
      profileId: profile.id,
      profileDisplayName: profile.displayName,
    });
  };

  return (
    <TouchableHighlight
      underlayColor={color.gray100}
      onPress={handlePressProfile}>
      <View style={profileListItemStyles.container}>
        <FastImage
          source={profile.avatar ? { uri: profile.avatar.url } : DEFAULT_AVATAR}
          style={profileListItemStyles.avatar}
        />
        <View style={profileListItemStyles.innerContainer}>
          <Text
            style={[
              isMyProfile
                ? [font.mediumBold, { color: color.accent }]
                : font.medium,
            ]}>
            {isMyProfile ? 'You' : profile.displayName}
          </Text>
          <Spacer.Vertical value={layout.spacing.xs} />
          <Text style={[font.small, { color: color.gray500 }]}>
            {profile.biography || 'No biography'}
          </Text>
        </View>
        <Icon name="chevron-forward" size={24} color={color.black} />
      </View>
    </TouchableHighlight>
  );
};

// eslint-disable-next-line react/display-name
InnerProfileListItem.Pending = () => (
  <View style={profileListItemStyles.container}>
    <View style={profileListItemStyles.avatar} />
    <View style={profileListItemStyles.innerContainer}>
      <View
        style={{ height: 19, width: '45%', backgroundColor: color.placeholder }}
      />
      <Spacer.Vertical value={layout.spacing.xs} />
      <View
        style={{ height: 17, width: '75%', backgroundColor: color.placeholder }}
      />
    </View>
  </View>
);

const profileListItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.md,
  },
  avatar: {
    width: AVATAR_DIAMETER,
    height: AVATAR_DIAMETER,
    borderRadius: AVATAR_DIAMETER / 2,
    backgroundColor: color.placeholder,
  },
  innerContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginHorizontal: layout.spacing.md,
  },
});