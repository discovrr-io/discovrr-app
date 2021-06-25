import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useRoute } from '@react-navigation/core';
import { Tabs } from 'react-native-collapsible-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { Button, ErrorTabView, ToggleButton } from '../../components';
import PostMasonryList from '../../components/masonry/PostMasonryList';
import { selectProfileById } from './profilesSlice';
import { selectAllPosts } from '../posts/postsSlice';

import {
  colors,
  DEFAULT_ACTIVE_OPACITY,
  typography,
  values,
} from '../../constants';
import { useNavigation } from '@react-navigation/native';

const HEADER_MAX_HEIGHT = 280;
const HEADER_MIN_HEIGHT = 80;
const AVATAR_IMAGE_RADIUS = 80;

/**
 * @typedef {{ label: string, value: number, onPress?: () => void }} StatisticProps
 * @param {StatisticProps} param0
 */
function Statistic({ label, value, onPress = undefined }) {
  return (
    <TouchableOpacity
      activeOpacity={DEFAULT_ACTIVE_OPACITY}
      style={statisticStyles.container}>
      <Text style={statisticStyles.label}>{label}</Text>
      <Text style={statisticStyles.value}>
        {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
    </TouchableOpacity>
  );
}

const statisticStyles = StyleSheet.create({
  container: {
    width: 85,
  },
  label: {
    color: colors.white,
    fontSize: typography.size.x,
    paddingBottom: values.spacing.sm,
    textAlign: 'center',
  },
  value: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.size.h4,
    textAlign: 'center',
  },
});

/**
 * @typedef {import('../../models').Profile} Profile
 * @param {{ profile: Profile }} param0
 */
function ProfileScreenHeaderContent({ profile }) {
  const navigation = useNavigation();

  const { avatar, fullName, description = 'No description' } = profile;
  const followersCount = profile.followers?.length ?? 0;
  const followingCount = profile.following?.length ?? 0;

  /** @type {Profile | undefined} */
  const currentUserProfile = useSelector((state) => state.auth.user?.profile);
  const isMyProfile =
    currentUserProfile && currentUserProfile.id === profile.id;

  return (
    <View style={profileScreenHeaderContentStyles.container}>
      <View style={{ flexDirection: 'row', marginBottom: values.spacing.md }}>
        <FastImage
          source={avatar}
          style={{
            width: AVATAR_IMAGE_RADIUS,
            height: AVATAR_IMAGE_RADIUS,
            borderRadius: AVATAR_IMAGE_RADIUS / 2,
          }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignSelf: 'center',
            marginLeft: values.spacing.md,
            // backgroundColor: 'red',
          }}>
          <View
            style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Statistic label="Followers" value={followersCount} />
            <Statistic label="Following" value={followingCount} />
            <Statistic label="Likes" value={-1} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              marginTop: values.spacing.md,
              // backgroundColor: 'blue',
            }}>
            {isMyProfile ? (
              <Button
                transparent
                size="small"
                title="Edit Profile"
                onPress={() => navigation.navigate('ProfileEditScreen')}
                style={{ flex: 1 }}
              />
            ) : (
              <>
                <ToggleButton
                  transparent
                  size="small"
                  titles={{ on: 'Following', off: 'Follow' }}
                  style={{ flex: 1, marginRight: values.spacing.xs * 1.5 }}
                />
                <Button
                  transparent
                  size="small"
                  title="Message"
                  onPress={() => {}}
                  style={{ flex: 1, marginLeft: values.spacing.xs * 1.5 }}
                />
              </>
            )}
          </View>
        </View>
      </View>
      <Text
        style={[
          profileScreenHeaderContentStyles.textContainer,
          profileScreenHeaderContentStyles.profileFullName,
        ]}>
        {fullName}
      </Text>
      <Text style={profileScreenHeaderContentStyles.textContainer}>
        {description}
      </Text>
    </View>
  );
}

const profileScreenHeaderContentStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    padding: values.spacing.md * 1.5,
    backgroundColor: 'rgba(82, 82, 82, 0.8)',
  },
  textContainer: {
    fontSize: typography.size.sm,
    color: colors.white,
  },
  profileFullName: {
    fontSize: typography.size.h4,
    marginBottom: values.spacing.sm,
  },
});

/**
 * @typedef {import('../../models').ProfileId} ProfileId
 * @param {{ profileId: ProfileId }} param0
 */
function ProfileScreenHeader({ profileId }) {
  const profile = useSelector((state) => selectProfileById(state, profileId));
  if (!profile) {
    console.error(
      '[ProfileScreenHeader] Failed to select profile with id:',
      profileId,
    );
    return null;
  }

  return (
    <View pointerEvents="box-none">
      <FastImage
        source={profile.coverPhoto}
        style={{
          height: HEADER_MAX_HEIGHT,
          width: '100%',
          backgroundColor: colors.gray100,
        }}
      />
      <ProfileScreenHeaderContent profile={profile} />
    </View>
  );
}

export default function ProfileScreen() {
  const { top: topInset } = useSafeAreaInsets();
  const { profileId, isMyProfile } = useRoute().params ?? {};

  /** @type {ProfileId | undefined} */
  let resolvedProfileId = profileId;

  if (!resolvedProfileId && isMyProfile) {
    /** @type {import('../authentication/authSlice').AuthState} */
    const { user } = useSelector((state) => state.auth);
    const currentUserProfileId = user?.profile.id;
    if (user) resolvedProfileId = currentUserProfileId;
  }

  if (!resolvedProfileId && !isMyProfile) {
    console.error('[ProfileScreen] No profileId was provided');
    return <ErrorTabView error="No profile ID was provided" />;
  }

  const postIds = useSelector((state) => {
    /** @type {import('../../models').Post[]} */
    const allPosts = selectAllPosts(state);
    return allPosts
      .filter((post) => post.profileId === resolvedProfileId)
      .map((post) => post.id);
  });

  return (
    <Tabs.Container
      lazy
      // minHeaderHeight={topInset + HEADER_MIN_HEIGHT}
      snapThreshold={0.25}
      HeaderComponent={() => (
        <ProfileScreenHeader profileId={resolvedProfileId} />
      )}>
      <Tabs.Tab name="posts" label="Posts">
        <Tabs.ScrollView>
          <PostMasonryList smallContent showFooter={false} postIds={postIds} />
        </Tabs.ScrollView>
      </Tabs.Tab>
      <Tabs.Tab name="notes" label="Notes">
        <Tabs.ScrollView></Tabs.ScrollView>
      </Tabs.Tab>
    </Tabs.Container>
  );
}
