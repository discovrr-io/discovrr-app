import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import { useRoute } from '@react-navigation/core';
import { Tabs } from 'react-native-collapsible-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { ErrorTabView } from '../../components';
import { selectProfileById } from './profilesSlice';
import { colors, values } from '../../constants';
import PostMasonryList from '../../components/masonry/PostMasonryList';
import { selectAllPosts } from '../posts/postsSlice';

const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 80;
const AVATAR_IMAGE_RADIUS = 80;

/**
 * @typedef {import('../../models').Profile} Profile
 * @param {{ profile: Profile }} param0
 */
function ProfileScreenHeaderContent({ profile }) {
  const { avatar } = profile;

  return (
    <View style={profileScreenHeaderContentStyles.container}>
      <FastImage
        source={avatar}
        style={{
          width: AVATAR_IMAGE_RADIUS,
          height: AVATAR_IMAGE_RADIUS,
          borderRadius: AVATAR_IMAGE_RADIUS / 2,
        }}
      />
    </View>
  );
}

const profileScreenHeaderContentStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    paddingVertical: values.spacing.md * 1.25,
    paddingHorizontal: values.spacing.md * 1.5,
    backgroundColor: 'rgba(82, 82, 82, 0.8)',
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

  /** @type {import('../authentication/authSlice').AuthState} */
  const { user } = useSelector((state) => state.auth);
  const currentUserProfileId = user?.profile.id;

  if (!resolvedProfileId && isMyProfile) {
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
      minHeaderHeight={topInset + HEADER_MIN_HEIGHT}
      snapThreshold={0.25}
      HeaderComponent={() => (
        <ProfileScreenHeader profileId={resolvedProfileId} />
      )}>
      <Tabs.Tab name="posts" label="Posts">
        <Tabs.ScrollView>
          <PostMasonryList
            smallContent
            showFooter={profileId !== currentUserProfileId}
            postIds={postIds}
          />
        </Tabs.ScrollView>
      </Tabs.Tab>
      <Tabs.Tab name="notes" label="Notes">
        <Tabs.ScrollView></Tabs.ScrollView>
      </Tabs.Tab>
    </Tabs.Container>
  );
}
