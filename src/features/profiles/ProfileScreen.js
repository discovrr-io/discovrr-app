import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import { Tabs } from 'react-native-collapsible-tab-view';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/core';
import { useDispatch, useSelector } from 'react-redux';

import NoteMasonryList from '../../components/masonry/NoteMasonryList';
import PostMasonryList from '../../components/masonry/PostMasonryList';
import { DEFAULT_AVATAR } from '../../constants/media';
import { FEATURE_UNAVAILABLE } from '../../constants/strings';
import { ProfileApi } from '../../api';
import { selectAllNotes } from '../notes/notesSlice';
import { selectAllPosts, selectPostsByProfile } from '../posts/postsSlice';

import {
  Button,
  EmptyTabView,
  RouteError,
  ToggleButton,
} from '../../components';

import {
  DEFAULT_ACTIVE_OPACITY,
  colors,
  typography,
  values,
} from '../../constants';

import {
  didChangeFollowStatus,
  fetchProfileById,
  selectProfileById,
} from './profilesSlice';

const HEADER_MAX_HEIGHT = 280;
// const HEADER_MIN_HEIGHT = 80;
const AVATAR_IMAGE_RADIUS = 80;

/**
 * @typedef {{ label: string, value: number, onPress?: () => void }} StatisticProps
 * @param {StatisticProps} param0
 */
function Statistic({ label, value, onPress = undefined }) {
  return (
    <TouchableOpacity
      activeOpacity={DEFAULT_ACTIVE_OPACITY}
      onPress={onPress}
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

const alertUnavailableFeature = () =>
  Alert.alert(FEATURE_UNAVAILABLE.title, FEATURE_UNAVAILABLE.message);

const alertRequestFailure = () =>
  Alert.alert(
    'Something went wrong',
    `Sorry, we weren't able to complete your request. Please try again later.`,
  );

/**
 * @typedef {import('../../models').Profile} Profile
 * @typedef {Omit<Profile, 'id' | 'email'> & { id?: string, isMyProfile?: boolean, totalLikes?: number }} ProfileDetails
 * @param {{ profileDetails: ProfileDetails | undefined }} param0
 */
function ProfileScreenHeaderContent({ profileDetails }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  const {
    avatar = DEFAULT_AVATAR,
    fullName = 'Anonymous',
    description = 'No description',
    followers = [],
    following = [],
    totalLikes = 0,
  } = profileDetails ?? {};

  const followersCount = followers.length ?? 0;
  const followingCount = following.length ?? 0;

  /** @type {Profile | undefined} */
  const currentProfile = useSelector((state) => state.auth.user?.profile);

  const isFollowingProfile = followers.includes(currentProfile.id);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);

  /**
   * @param {boolean} didFollow
   * @returns A boolean with the new value (or the previous value if it failed)
   */
  const handleFollowButtonPress = async (didFollow) => {
    if (profileDetails.isVendor) {
      alertUnavailableFeature();
      return !didFollow;
    } else if (!profileDetails.id) {
      alertRequestFailure();
      return !didFollow;
    }

    const followeeId = profileDetails.id;

    try {
      setIsProcessingFollow(true);

      const changeFollowStatusAction = didChangeFollowStatus({
        didFollow,
        followeeId,
        followerId: currentProfile.id,
      });

      dispatch(changeFollowStatusAction);
      await ProfileApi.changeProfileFollowStatus(followeeId, didFollow);
    } catch (error) {
      console.error('Failed to change follow status:', error);
      alertRequestFailure();

      // Revert the action by simply toggling it back to its previous value
      const revertChangeFollowStatusAction = didChangeFollowStatus({
        didFollow: !didFollow,
        followeeId,
        followerId: currentProfile.id,
      });

      dispatch(revertChangeFollowStatusAction);
    } finally {
      setIsProcessingFollow(false);
    }
  };

  /**
   * @param {import('./FollowerScreen').FollowerScreenSelector} selector
   */
  const handleGoToFollowerScreen = (selector) => {
    if (profileDetails.isVendor) {
      alertUnavailableFeature();
    } else {
      navigation.push('FollowerScreen', {
        profileId: profileDetails.id,
        profileName: profileDetails.fullName,
        selector,
      });
    }
  };

  return (
    <View style={profileScreenHeaderContentStyles.container}>
      <View style={{ flexDirection: 'row', marginBottom: values.spacing.md }}>
        <FastImage
          source={avatar}
          style={{
            width: AVATAR_IMAGE_RADIUS,
            height: AVATAR_IMAGE_RADIUS,
            borderRadius: AVATAR_IMAGE_RADIUS / 2,
            backgroundColor: colors.gray100,
          }}
        />
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignSelf: 'center',
            marginLeft: values.spacing.md,
          }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginHorizontal: values.spacing.md * 1.5,
            }}>
            <Statistic
              label="Followers"
              value={followersCount}
              onPress={() => handleGoToFollowerScreen('followers')}
            />
            <Statistic
              label="Following"
              value={followingCount}
              onPress={() => handleGoToFollowerScreen('following')}
            />
            <Statistic label="Likes" value={totalLikes} />
          </View>
          <View
            style={{
              flexDirection: 'row',
              marginTop: values.spacing.md,
            }}>
            {profileDetails.isMyProfile ? (
              <Button
                transparent
                size="small"
                title="Edit Profile"
                onPress={() => navigation.navigate('ProfileEditScreen')}
                style={{ flex: 1 }}
              />
            ) : (
              <>
                {/* TODO: This doesn't toggle back if following failed */}
                <ToggleButton
                  transparent
                  size="small"
                  initialState={isFollowingProfile}
                  titles={{ on: 'Following', off: 'Follow' }}
                  isLoading={isProcessingFollow}
                  onPress={handleFollowButtonPress}
                  style={{ flex: 1, marginRight: values.spacing.xs * 1.5 }}
                />
                <Button
                  transparent
                  size="small"
                  title="Block"
                  onPress={() =>
                    Alert.alert(
                      FEATURE_UNAVAILABLE.title,
                      FEATURE_UNAVAILABLE.message,
                    )
                  }
                  style={{ flex: 1, marginLeft: values.spacing.xs * 1.5 }}
                />
              </>
            )}
          </View>
        </View>
      </View>
      <Text
        numberOfLines={1}
        style={[
          profileScreenHeaderContentStyles.textContainer,
          profileScreenHeaderContentStyles.profileFullName,
        ]}>
        {fullName || 'Anonymous'}
      </Text>
      <Text
        numberOfLines={4}
        style={profileScreenHeaderContentStyles.textContainer}>
        {description || 'No description'}
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
 * @param {{ profileDetails: ProfileDetails }} param0
 */
export function ProfileScreenHeader({ profileDetails }) {
  const coverPhoto =
    typeof profileDetails.coverPhoto === 'number'
      ? undefined
      : profileDetails.coverPhoto;

  return (
    <View pointerEvents="box-none">
      <FastImage
        source={coverPhoto}
        resizeMode="cover"
        style={{
          height: HEADER_MAX_HEIGHT,
          width: '100%',
          backgroundColor: colors.gray100,
        }}
      />
      <ProfileScreenHeaderContent profileDetails={profileDetails} />
    </View>
  );
}

export default function ProfileScreen() {
  const dispatch = useDispatch();

  /**
   * @typedef {import('../../models').ProfileId} ProfileId
   * @type {{ profileId: ProfileId | undefined }}
   */
  const { profileId } = useRoute().params ?? {};

  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [isRefreshingPosts, setIsRefreshingPosts] = useState(false);
  const [isRefreshingNotes, setIsRefreshingNotes] = useState(false);

  /** @type {import('../authentication/authSlice').AuthState} */
  const { user } = useSelector((state) => state.auth);
  const currentUserProfileId = user?.profile.id;

  let resolvedProfileId = profileId;
  let isMyProfile =
    !!resolvedProfileId && currentUserProfileId === resolvedProfileId;

  // If no profile id was given, we'll assume the "My Profile" tab was pressed
  if (!resolvedProfileId) {
    if (currentUserProfileId) {
      console.info(
        '[ProfileScreen]',
        'No profile id was given. Falling back to current user profile:',
        currentUserProfileId,
      );
      resolvedProfileId = currentUserProfileId;
      isMyProfile = true;
    } else {
      console.error(
        '[ProfileScreen] No profile id was given and/or the user was undefined',
      );
      return <RouteError />;
    }
  }

  const profile = useSelector((state) =>
    selectProfileById(state, resolvedProfileId),
  );

  const posts = useSelector((state) => selectPostsByProfile(state, profileId));

  const postIds = posts.map((post) => post.id);
  const totalLikes = posts
    .map((post) => post.statistics?.totalLikes ?? 0)
    .reduce((acc, curr) => acc + curr, 0);

  const noteIds = useSelector((state) => {
    const allNotes = selectAllNotes(state);
    return allNotes
      .filter((note) => {
        if (isMyProfile) {
          return note.profileId === resolvedProfileId;
        } else {
          return note.isPublic && note.profileId === resolvedProfileId;
        }
      })
      .map((note) => note.id);
  });

  useEffect(() => {
    if (shouldRefresh)
      (async () => {
        try {
          console.log('[ProfileScreen] Will fetch profile...');
          await dispatch(fetchProfileById(profileId)).unwrap();
        } catch (error) {
          console.error('[ProfileScreen] Failed to refresh profile:', error);
          Alert.alert(
            'Something went wrong',
            "We weren't able to refresh this profile. Please try again later.",
          );
        } finally {
          setShouldRefresh(false);
        }
      })();
  }, [shouldRefresh]);

  const handleRefreshPosts = async () => {
    await new Promise((resolve, _) => {
      setTimeout(() => {
        setIsRefreshingPosts(false);
        resolve([]);
      }, 3000);
    });
  };

  const handleRefreshNotes = async () => {
    await new Promise((resolve, _) => {
      setTimeout(() => {
        setIsRefreshingNotes(false);
        resolve([]);
      }, 3000);
    });
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs.Container
        lazy
        // minHeaderHeight={topInset + HEADER_MIN_HEIGHT}
        snapThreshold={0.25}
        HeaderComponent={() => (
          <ProfileScreenHeader
            profileDetails={{ ...profile, isMyProfile, totalLikes }}
          />
        )}>
        <Tabs.Tab name="posts" label="Posts">
          <Tabs.ScrollView
            refreshControl={
              <RefreshControl
                refreshing={isRefreshingPosts}
                onRefresh={handleRefreshPosts}
              />
            }>
            <PostMasonryList
              smallContent
              showFooter={false}
              postIds={postIds}
              ListEmptyComponent={
                <EmptyTabView
                  message={
                    isMyProfile
                      ? "Looks like you haven't posted anything"
                      : `Looks like ${
                          profile.fullName || 'this user'
                        } hasn't posted anything yet`
                  }
                />
              }
            />
          </Tabs.ScrollView>
        </Tabs.Tab>
        <Tabs.Tab name="notes" label="Notes">
          <Tabs.ScrollView
            refreshControl={
              <RefreshControl
                refreshing={isRefreshingNotes}
                onRefresh={handleRefreshNotes}
              />
            }>
            <NoteMasonryList
              smallContent
              noteIds={noteIds}
              ListEmptyComponent={
                <EmptyTabView
                  message={
                    isMyProfile
                      ? "Looks like you haven't shared any public notes"
                      : `Looks like ${
                          profile.fullName || 'this user'
                        } hasn't shared any public notes yet`
                  }
                />
              }
            />
          </Tabs.ScrollView>
        </Tabs.Tab>
      </Tabs.Container>
    </SafeAreaView>
  );
}
