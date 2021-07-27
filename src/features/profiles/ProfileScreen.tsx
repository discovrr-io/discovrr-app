import React, { useEffect, useMemo, useState } from 'react';
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
import { Tabs, MaterialTabBar } from 'react-native-collapsible-tab-view';
import { useNavigation } from '@react-navigation/native';
import { useRoute } from '@react-navigation/core';
import { useDispatch, useSelector } from 'react-redux';

import NoteMasonryList from '../../components/masonry/NoteMasonryList';
import PostMasonryList from '../../components/masonry/PostMasonryList';
import { DEFAULT_AVATAR } from '../../constants/media';
import { useIsMounted } from '../../hooks';
import { NotificationApi } from '../../api';
import { selectAllNotes } from '../notes/notesSlice';
import { RootState, useAppDispatch } from '../../store';

import {
  FEATURE_UNAVAILABLE,
  SOMETHING_WENT_WRONG,
} from '../../constants/strings';

import {
  fetchPostsForProfile,
  selectPostsByProfile,
} from '../posts/postsSlice';

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
  changeProfileFollowStatus,
  fetchProfileById,
  selectProfileById,
} from './profilesSlice';
import { Profile, ProfileId } from '../../models';
import { MerchantAddress } from '../../models/merchant';

export const HEADER_MAX_HEIGHT = 280;
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

type ProfileDetails = Omit<Profile, 'id' | 'email'> & {
  id?: string;
  totalLikes?: number;
  address?: MerchantAddress;
};

type ProfileScreenHeaderContentParams = {
  profileDetails: ProfileDetails;
};

function ProfileScreenHeaderContent({ profileDetails }) {
  const dispatch = useAppDispatch();

  const navigation = useNavigation();
  const isMounted = useIsMounted();

  const {
    avatar = DEFAULT_AVATAR,
    fullName = 'Anonymous',
    description = 'No description',
    followers = [],
    following = [],
    totalLikes = 0,
    address = undefined,
  } = profileDetails ?? {};

  const addressString = useMemo(() => {
    if (!address) return undefined;
    const addressLine1 = address.addressLine1;
    const addressLine2 = address.addressLine2 ? ' ' + address.addressLine2 : '';
    const street = address.street ? ' ' + address.street : '';
    const city = address.city ? ', ' + address.city : '';
    const state = address.state ? ', ' + address.state : '';
    return `${addressLine1}${addressLine2}${street}${city}${state}`;
  }, [address]);

  const followersCount = followers.length ?? 0;
  const followingCount = following.length ?? 0;

  const currentUserProfileId = useSelector(
    (state: RootState) => state.auth.user.profileId,
  );
  const currentUserProfile = useSelector((state: RootState) =>
    selectProfileById(state, currentUserProfileId),
  );

  const isMyProfile =
    currentUserProfileId &&
    profileDetails.id &&
    currentUserProfileId === profileDetails.id;

  const isFollowing = followers.includes(currentUserProfileId);
  const isFollowee = following.includes(currentUserProfileId);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);

  // const [isBlocked, setIsBlocked] = useState(false);
  // const [isProcessingBlock, setIsProcessingBlock] = useState(false);

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

      const changeFollowStatusAction = changeProfileFollowStatus({
        followeeId,
        followerId: currentUserProfileId,
        didFollow,
      });

      await dispatch(changeFollowStatusAction).unwrap();

      if (didFollow && profileDetails.id && !isMyProfile) {
        try {
          const { fullName = 'Someone' } = currentUserProfile ?? {};
          await NotificationApi.sendNotificationToProfileIds(
            [profileDetails.id],
            { en: `${fullName} followed you!` },
            { en: 'Why not follow them back? 😃' },
            `discovrr://profile/${currentUserProfileId}`,
          );
        } catch (error) {
          console.error(
            '[ProfileScreenHeaderContent] Failed to send notification:',
            error,
          );
        }
      }
    } catch (error) {
      console.error('Failed to change follow status:', error);
      alertRequestFailure();
    } finally {
      if (isMounted.current) setIsProcessingFollow(false);
    }
  };

  /**
   * @param {import('./FollowerScreen').FollowerScreenSelector} selector
   */
  const handleGoToFollowerScreen = (selector) => {
    if (profileDetails.isVendor) {
      alertUnavailableFeature();
    } else {
      // @ts-ignore
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
                {/* TODO: This doesn't toggle back if following failed */}
                <ToggleButton
                  transparent
                  size="small"
                  initialState={isFollowing}
                  titles={{
                    on: 'Following',
                    off: isFollowee ? 'Follow Back' : 'Follow',
                  }}
                  isLoading={isProcessingFollow}
                  onPress={handleFollowButtonPress}
                  style={{ flex: 1, marginRight: values.spacing.xs * 1.5 }}
                />
                <Button
                  transparent
                  size="small"
                  title={'Message'}
                  onPress={alertUnavailableFeature}
                  style={{ flex: 1, marginLeft: values.spacing.xs * 1.5 }}
                />
                {/* <Button
                  transparent
                  size="small"
                  title={isBlocked ? 'Unblock' : 'Block'}
                  isLoading={isProcessingBlock}
                  onPress={() => {
                    if (isBlocked) {
                      setIsBlocked(false);
                      return;
                    }

                    setIsProcessingBlock(true);
                    setTimeout(() => {
                      Alert.alert(
                        'Report Successfully Sent',
                        'Your report will be reviewed by one of our moderators.',
                      );
                      setIsBlocked(true);
                      setIsProcessingBlock(false);
                    }, 2000);
                  }}
                  style={{ flex: 1, marginLeft: values.spacing.xs * 1.5 }}
                /> */}
              </>
            )}
          </View>
        </View>
      </View>
      <Text
        numberOfLines={1}
        style={[
          profileScreenHeaderContentStyles.text,
          profileScreenHeaderContentStyles.profileFullName,
        ]}>
        {fullName || 'Anonymous'}
      </Text>
      {profileDetails.isVendor && addressString && (
        <Text
          style={[
            profileScreenHeaderContentStyles.text,
            { marginBottom: values.spacing.sm },
          ]}>
          {addressString}
        </Text>
      )}
      <Text numberOfLines={3} style={profileScreenHeaderContentStyles.text}>
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
  text: {
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
  const $FUNC = '[ProfileScreen]';
  const dispatch = useAppDispatch();

  const { profileId }: { profileId?: ProfileId } = useRoute().params ?? {};

  const isMounted = useIsMounted();
  const [shouldRefresh, setShouldRefresh] = useState(true);
  // const [isRefreshingPosts, setIsRefreshingPosts] = useState(false);
  // const [isRefreshingNotes, setIsRefreshingNotes] = useState(false);

  const currentUserProfileId = useSelector(
    (state: RootState) => state.auth.user.profileId,
  );

  let resolvedProfileId = profileId;
  let isMyProfile =
    !!resolvedProfileId && currentUserProfileId === resolvedProfileId;

  // If no profile id was given, we'll assume the "My Profile" tab was pressed
  if (!resolvedProfileId) {
    if (currentUserProfileId) {
      console.info(
        $FUNC,
        'No profile id was given. Falling back to current user profile:',
        currentUserProfileId,
      );
      resolvedProfileId = currentUserProfileId;
      isMyProfile = true;
    } else {
      console.error(
        $FUNC,
        'No profile id was given and/or the user was undefined',
      );
      return <RouteError />;
    }
  }

  const profile = useSelector((state: RootState) =>
    selectProfileById(state, resolvedProfileId),
  );

  const posts = useSelector((state: RootState) =>
    selectPostsByProfile(state, profileId),
  );

  const postIds = posts.map((post) => post.id);
  const totalLikes = posts
    .map((post) => post.statistics?.totalLikes ?? 0)
    .reduce((acc, curr) => acc + curr, 0);

  const noteIds = useSelector((state: RootState) => {
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
          console.log($FUNC, 'Fetch profile data...');
          await Promise.all([
            dispatch(
              fetchProfileById({ profileId: resolvedProfileId, reload: true }),
            ).unwrap(),
            dispatch(fetchPostsForProfile(resolvedProfileId)).unwrap(),
          ]);
        } catch (error) {
          console.error($FUNC, 'Failed to refresh profile:', error);
          Alert.alert(
            SOMETHING_WENT_WRONG.title,
            "We weren't able to refresh this profile. Please try again later.",
          );
        } finally {
          if (isMounted.current) setShouldRefresh(false);
        }
      })();
  }, [shouldRefresh]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  // const handleRefreshPosts = () => {
  //   await new Promise((resolve, _) => {
  //     setTimeout(() => {
  //       setIsRefreshingPosts(false);
  //       resolve([]);
  //     }, 3000);
  //   });
  // };

  // const handleRefreshNotes = async () => {
  //   await new Promise((resolve, _) => {
  //     setTimeout(() => {
  //       setIsRefreshingNotes(false);
  //       resolve([]);
  //     }, 3000);
  //   });
  // };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Tabs.Container
        lazy
        snapThreshold={0.25}
        HeaderComponent={() => (
          <ProfileScreenHeader
            profileDetails={{ ...profile, isMyProfile, totalLikes }}
          />
        )}
        TabBarComponent={(props) => (
          <MaterialTabBar
            {...props}
            activeColor={colors.black}
            inactiveColor={colors.gray700}
            indicatorStyle={{ backgroundColor: colors.accent }}
          />
        )}>
        <Tabs.Tab name="posts" label="Posts">
          <PostMasonryList
            smallContent
            showFooter={false}
            postIds={postIds}
            bottomSpacing={0}
            contentContainerStyle={{ paddingBottom: values.spacing.md }}
            refreshControl={
              <RefreshControl
                title="Loading posts..."
                refreshing={shouldRefresh}
                onRefresh={handleRefresh}
              />
            }
            // @ts-ignore
            ScrollViewComponent={Tabs.ScrollView}
            ListEmptyComponent={
              <EmptyTabView
                message={
                  isMyProfile
                    ? "You haven't posted anything"
                    : `${
                        profile?.fullName || 'This user'
                      } hasn't posted anything yet`
                }
              />
            }
          />
        </Tabs.Tab>
        <Tabs.Tab name="notes" label="Notes">
          <NoteMasonryList
            smallContent
            noteIds={noteIds}
            refreshControl={
              <RefreshControl
                refreshing={shouldRefresh}
                onRefresh={handleRefresh}
              />
            }
            // @ts-ignore
            ScrollViewComponent={Tabs.ScrollView}
            ListEmptyComponent={
              <EmptyTabView
                message={
                  isMyProfile
                    ? "You haven't shared any public notes"
                    : `${
                        profile?.fullName || 'This user'
                      } hasn't shared any public notes yet`
                }
              />
            }
          />
        </Tabs.Tab>
      </Tabs.Container>
    </SafeAreaView>
  );
}
