import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import FastImage from 'react-native-fast-image';
import MasonryList from 'react-native-masonry-list';
import { Tabs } from 'react-native-collapsible-tab-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRoute } from '@react-navigation/core';
import { useSelector } from 'react-redux';

import { Button, PostItem, RouteError, ToggleButton } from '../../components';
import { selectProfileById } from './profilesSlice';
import { colors, typography, values } from '../../constants';
import { selectPostsByProfile } from '../posts/postsSlice';

const imagePlaceholder = require('../../../resources/images/imagePlaceholder.png');

const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 60;
const AVATAR_IMAGE_RADIUS = 80;

/**
 * @typedef {{ label: string, value: number, onPress?: () => void }} MetricProps
 * @param {MetricProps} param0
 */
function Metric({ label, value, onPress = () => {} }) {
  return (
    <TouchableOpacity onPress={onPress} style={metricStyles.container}>
      <Text style={metricStyles.label}>{label}</Text>
      <Text style={metricStyles.value}>
        {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
    </TouchableOpacity>
  );
}

const metricStyles = StyleSheet.create({
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
 * @typedef {{ profile: Profile }} ProfileScreenHeaderProps
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {ProfileScreenHeaderProps & ViewProps} param0
 */
function ProfileScreenHeader({ profile, ...props }) {
  const { fullName, avatar, coverPhoto } = profile;
  const description = profile.description || 'No description';

  /** @type {import('../../models').User} */
  const { profile: currentUserProfile } = useSelector(
    (state) => state.auth.user,
  );
  const isMyProfile = currentUserProfile.id === profile.id;

  const followersCount = profile.followers?.length ?? 0;
  const followingCount = profile.following?.length ?? 0;

  return (
    <View pointerEvents="box-none" style={[props.style]}>
      <FastImage
        source={coverPhoto}
        style={profileScreenHeaderStyles.coverPhoto}
      />
      <View style={profileScreenHeaderStyles.container}>
        <View style={{ flexDirection: 'row', marginBottom: values.spacing.md }}>
          <FastImage source={avatar} style={profileScreenHeaderStyles.avatar} />
          <View
            style={{ flex: 1, justifyContent: 'center', alignSelf: 'center' }}>
            <View
              style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Metric label="Followers" value={followersCount} />
              <Metric label="Following" value={followingCount} />
              <Metric label="Likes" value={-1} />
            </View>
            <View
              style={{ flexDirection: 'row', marginTop: values.spacing.md }}>
              {isMyProfile ? (
                <Button
                  transparent
                  size="small"
                  title="Edit Profile"
                  style={profileScreenHeaderStyles.actionButton}
                />
              ) : (
                <>
                  <ToggleButton
                    transparent
                    size="small"
                    titles={{ on: 'Following', off: 'Follow' }}
                    style={profileScreenHeaderStyles.actionButton}
                  />
                  <Button
                    transparent
                    size="small"
                    title="Message"
                    style={profileScreenHeaderStyles.actionButton}
                  />
                </>
              )}
            </View>
          </View>
        </View>
        <Text
          style={[
            profileScreenHeaderStyles.containerText,
            profileScreenHeaderStyles.profileFullName,
          ]}>
          {fullName}
        </Text>
        <Text style={profileScreenHeaderStyles.containerText}>
          {description}
        </Text>
      </View>
    </View>
  );
}

const profileScreenHeaderStyles = StyleSheet.create({
  coverPhoto: {
    height: HEADER_MAX_HEIGHT,
    width: '100%',
  },
  avatar: {
    borderRadius: AVATAR_IMAGE_RADIUS / 2,
    width: AVATAR_IMAGE_RADIUS,
    height: AVATAR_IMAGE_RADIUS,
    marginRight: values.spacing.lg,
  },
  container: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    paddingVertical: values.spacing.md * 1.25,
    paddingHorizontal: values.spacing.md * 1.5,
    backgroundColor: 'rgba(82, 82, 82, 0.8)',
  },
  containerText: {
    fontSize: typography.size.sm,
    color: colors.white,
  },
  profileFullName: {
    fontSize: typography.size.h4,
    marginBottom: values.spacing.sm,
  },
  actionButton: {
    flex: 1,
    marginRight: values.spacing.md,
  },
});

function ProfilePostsTab({ profileId }) {
  const posts = useSelector((state) => selectPostsByProfile(state, profileId));

  return (
    <MasonryList
      sorted
      rerender
      columns={2}
      listContainerStyle={{ paddingTop: values.spacing.sm }}
      images={posts.map((post) => {
        let imagePreviewSource, imagePreviewDimensions;
        if (!post.media) {
          imagePreviewSource = imagePlaceholder;
          imagePreviewDimensions = {
            width: 800,
            height: 600,
          };
        } else {
          imagePreviewSource = post.media[0];
          imagePreviewDimensions = {
            width: imagePreviewSource?.width ?? 800,
            height: imagePreviewSource?.height ?? 600,
          };
        }

        return {
          id: post.id,
          type: post.type,
          source: imagePreviewSource,
          dimensions: imagePreviewDimensions,
        };
      })}
      completeCustomComponent={({ data }) => (
        <PostItem
          postId={data.id}
          type={data.type}
          column={data.column}
          imagePreview={data.source}
          imagePreviewDimensions={data.masonryDimensions}
          displayFooter={false}
        />
      )}
    />
  );
}

export default function ProfileScreen({ route }) {
  const { top: topInset } = useSafeAreaInsets();

  /** @type {import('../authentication/authSlice').AuthState} */
  const authState = useSelector((state) => state.auth);

  /** @type {string|null} */
  let profileId;
  if (route.params.isMyProfile) {
    profileId = authState.user?.profile.id;
  } else {
    profileId = route.params.profileId;
  }

  if (!profileId) {
    console.warn('[ProfileScreen] No profile ID given');
    return <RouteError />;
    // return null;
  }

  const profile = useSelector((state) => selectProfileById(state, profileId));
  if (!profile) {
    // TODO: Try to load the profile again just in case all the profiles haven't
    // been loaded and the user clicks the 'Profile' tab
    console.error('[ProfileScreen] Failed to select profile by id:', profileId);
    return <RouteError caption="We weren't able to load this profile." />;
  }

  return (
    <Tabs.Container
      lazy
      minHeaderHeight={topInset + HEADER_MIN_HEIGHT}
      snapThreshold={0.25}
      HeaderComponent={() => <ProfileScreenHeader profile={profile} />}>
      <Tabs.Tab name="posts" label="Posts">
        <Tabs.ScrollView>
          <ProfilePostsTab profileId={profile.id} />
        </Tabs.ScrollView>
      </Tabs.Tab>
      <Tabs.Tab name="notes" label="Notes">
        <Tabs.ScrollView>
          <Text>Notes</Text>
        </Tabs.ScrollView>
      </Tabs.Tab>
    </Tabs.Container>
  );
}
