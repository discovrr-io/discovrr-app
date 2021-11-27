import * as React from 'react';
import {
  ActivityIndicator,
  Animated as RNAnimated,
  DeviceEventEmitter,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import Video from 'react-native-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useHeaderHeight } from '@react-navigation/elements';

import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from '@react-navigation/core';

import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import * as authSlice from 'src/features/authentication/auth-slice';
import * as postsSlice from 'src/features/posts/posts-slice';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import * as productsSlice from 'src/features/products/products-slice';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import PostMasonryList from 'src/features/posts/PostMasonryList';
import ProductMasonryList from 'src/features/products/ProductMasonryList';

import { PostId, Profile, ProfileId } from 'src/models';
import { RootStackNavigationProp, RootStackScreenProps } from 'src/navigation';

import {
  ActionBottomSheet,
  ActionBottomSheetItem,
  AsyncGate,
  Button,
  EmptyContainer,
  LoadingContainer,
  RouteError,
  Spacer,
  ToggleButton,
} from 'src/components';

import { useIsMyProfile, useProfile } from './hooks';
import {
  useAppDispatch,
  useAppSelector,
  useExtendedTheme,
  useIsMounted,
} from 'src/hooks';

const MaterialTopTab = createMaterialTopTabNavigator();

// const BACKGROUND_COLOR = constants.color.white;
const HEADER_HEIGHT_RATIO = 0.58;
const BOTTOM_SHEET_HEIGHT_RATIO = 1 - HEADER_HEIGHT_RATIO;
const BOTTOM_SHEET_NUDGE = 24;

const HEADER_ANIMATION_DURATION = 200;
const PLAY_HEADER_VIDEO_FULLSCREEN_EVENT = 'playHeaderVideoFullscreen';
const PAUSE_HEADER_VIDEO_EVENT = 'pauseHeaderVideo';
const HIDE_HEADER_CONTENT = 'hideHeaderContent';

const ProfileDetailsContext = React.createContext<{
  profile: Profile;
  isMyProfile: boolean;
}>(null as any);

function useShouldFetchOnFocus() {
  const [shouldFetch, setShouldFetch] = React.useState(true);

  useFocusEffect(
    React.useCallback(() => {
      setShouldFetch(true);
      return () => setShouldFetch(false);
    }, []),
  );

  return [shouldFetch, setShouldFetch] as const;
}

type ProfileDetailsScreenProps = RootStackScreenProps<'ProfileDetails'>;

export default function ProfileDetailsScreen(props: ProfileDetailsScreenProps) {
  const params = props.route.params;
  if (
    typeof params.profileIdOrUsername === 'string' &&
    params.profileIdOrUsername.startsWith('@')
  ) {
    return (
      <ProfileByUsernameDetailsScreen username={params.profileIdOrUsername} />
    );
  } else {
    return (
      <ProfileByIdDetailsScreen
        profileId={params.profileIdOrUsername as ProfileId}
      />
    );
  }
}

type ProfileByUsernameDetailsScreenProps = {
  username: string;
};

function ProfileByUsernameDetailsScreen(
  props: ProfileByUsernameDetailsScreenProps,
) {
  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();
  const headerHeight = useHeaderHeight();
  const route = useRoute<ProfileDetailsScreenProps['route']>();

  const [profile, setProfile] = React.useState<Profile>();
  const [shouldFetch, setShouldFetch] = React.useState(true);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    async function fetchProfileByUsername() {
      try {
        setError(false);

        const username = props.username.slice(1);
        console.log(`Fetching profile by username '${username}'...`);

        const fetchedProfile = await dispatch(
          profilesSlice.fetchProfileByUsername({ username }),
        ).unwrap();

        setProfile(fetchedProfile);
      } catch (error) {
        console.error('Failed to fetch profile by username:', error);
        setError(true);
      } finally {
        if (isMounted.current) setShouldFetch(false);
      }
    }

    if (shouldFetch) fetchProfileByUsername();
  }, [dispatch, shouldFetch, props.username, isMounted]);

  if (error) {
    return (
      <RouteError
        message={`We couldn't find anyone with the username '${props.username}'`}
      />
    );
  } else if (shouldFetch || !profile) {
    return (
      <SafeAreaView
        style={{
          flexGrow: 1,
          justifyContent: 'center',
          paddingTop: headerHeight,
        }}>
        <LoadingContainer message="Loading profile…" />
      </SafeAreaView>
    );
  } else {
    return (
      <LoadedProfileDetailsScreen
        profile={profile}
        preferredWindowHeight={route.params.windowHeight}
      />
    );
  }
}

type ProfileByIdDetailsScreenProps = {
  profileId: ProfileId;
};

function ProfileByIdDetailsScreen(props: ProfileByIdDetailsScreenProps) {
  const profileData = useProfile(props.profileId);
  const headerHeight = useHeaderHeight();
  const route = useRoute<ProfileDetailsScreenProps['route']>();

  const renderRouteError = (_error?: any) => <RouteError />;

  return (
    <AsyncGate
      data={profileData}
      onPending={() => (
        <SafeAreaView
          style={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: headerHeight,
          }}>
          <LoadingContainer message="Loading profile…" />
        </SafeAreaView>
      )}
      onFulfilled={profile => {
        if (!profile) return renderRouteError();
        return (
          <LoadedProfileDetailsScreen
            profile={profile}
            preferredWindowHeight={route.params.windowHeight}
          />
        );
      }}
      onRejected={renderRouteError}
    />
  );
}

export type LoadedProfileDetailsScreenProps = {
  profile: Profile;
  preferredTitle?: string;
  preferredWindowHeight?: number;
};

export function LoadedProfileDetailsScreen(
  props: LoadedProfileDetailsScreenProps,
) {
  const $FUNC = '[LoadedProfileDetailScreen]';
  const { profile, preferredWindowHeight } = props;
  const { height: calculatedWindowHeight } = useWindowDimensions();

  const dispatch = useAppDispatch();
  const navigation = useNavigation<ProfileDetailsScreenProps['navigation']>();
  const { colors, dark } = useExtendedTheme();

  const isMounted = useIsMounted();
  const [shouldFetch, setShouldFetch] = useShouldFetchOnFocus();

  const windowHeight = React.useMemo(() => {
    if (preferredWindowHeight) return preferredWindowHeight;
    return calculatedWindowHeight;
  }, [calculatedWindowHeight, preferredWindowHeight]);

  const isMyProfile = useIsMyProfile(profile.profileId);
  const headerHeight = useHeaderHeight();
  const headerTitleOpacity = React.useRef(new RNAnimated.Value(0)).current;

  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(
    () => [
      windowHeight * BOTTOM_SHEET_HEIGHT_RATIO + BOTTOM_SHEET_NUDGE,
      windowHeight - headerHeight,
    ],
    [headerHeight, windowHeight],
  );

  const actionBottomSheetRef = React.useRef<BottomSheet>(null);
  const actionBottomSheetItems = React.useMemo(() => {
    const items: ActionBottomSheetItem[] = [];

    if (!isMyProfile) {
      items.push(
        {
          id: 'block',
          label: `Block ${profile.__publicName}`,
          iconName: 'hand-right-outline',
          destructive: true,
        },
        {
          id: 'report',
          label: `Report ${profile.__publicName}`,
          iconName: 'flag-outline',
        },
      );
    }

    return [
      ...items,
      { id: 'share', label: 'Share Profile', iconName: 'share-social-outline' },
    ];
  }, [isMyProfile, profile]);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      title: props.preferredTitle || profile.__publicName,
      headerTitleStyle: [
        constants.font.defaultHeaderTitleStyle,
        { opacity: headerTitleOpacity },
      ],
      headerRight: ({ tintColor }) => (
        <View
          style={{
            flexDirection: 'row-reverse',
            paddingStart: constants.layout.defaultScreenMargins.horizontal,
          }}>
          <TouchableOpacity
            activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
            onPress={() => actionBottomSheetRef.current?.expand()}>
            <Icon
              name={Platform.select({
                android: 'ellipsis-vertical',
                default: 'ellipsis-horizontal',
              })}
              size={24}
              color={tintColor || constants.color.defaultLightTextColor}
            />
          </TouchableOpacity>
          {profile.background?.mime.includes('video') && (
            <>
              <Spacer.Horizontal value="lg" />
              <TouchableOpacity
                activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
                onPress={() =>
                  DeviceEventEmitter.emit(PLAY_HEADER_VIDEO_FULLSCREEN_EVENT)
                }>
                <Icon
                  name="expand-outline"
                  size={24}
                  color={tintColor || constants.color.defaultLightTextColor}
                />
              </TouchableOpacity>
            </>
          )}
        </View>
      ),
    });
  }, [
    navigation,
    headerTitleOpacity,
    props.preferredTitle,
    profile.__publicName,
    profile.background?.mime,
  ]);

  useFocusEffect(
    React.useCallback(() => {
      StatusBar.setBarStyle('light-content', true);
      return () => {
        if (!dark) StatusBar.setBarStyle('dark-content', true);
      };
    }, [dark]),
  );

  React.useEffect(
    () => {
      async function fetchProfile() {
        try {
          await dispatch(
            profilesSlice.fetchProfileById({
              profileId: profile.profileId,
              reload: true,
            }),
          ).unwrap();
        } catch (error) {
          console.error($FUNC, 'Failed to fetch profile:', error);
        } finally {
          if (isMounted.current) setShouldFetch(false);
        }
      }

      if (shouldFetch) fetchProfile();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, shouldFetch, profile.profileId],
  );

  const handleSelectActionItem = (selectedItemId: string) => {
    switch (selectedItemId) {
      case 'block':
        utilities.alertUnavailableFeature({
          title: "We're still working on this",
          message:
            'In the meantime, you may report this profile. Your report will be anonymous.',
        });
        break;
      case 'report':
        // FIXME: On iOS the status bar goes dark when the report screen is
        // visible, but it should have the light-content bar style instead.
        navigation.navigate('ReportItem', {
          screen: 'ReportItemReason',
          params: { type: 'profile' },
        });
        break;
      default:
        actionBottomSheetRef.current?.close();
        break;
    }
  };

  return (
    <ProfileDetailsContext.Provider value={{ profile, isMyProfile }}>
      {Platform.OS === 'ios' && !dark && (
        <StatusBar animated barStyle="light-content" />
      )}
      <SafeAreaView
        edges={['bottom', 'left', 'right']}
        style={{ flex: 1, backgroundColor: colors.background }}>
        <ProfileDetailsHeader preferredWindowHeight={windowHeight} />
        {/* TODO: Don't render this when the bottom sheet is open */}
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={constants.color.gray500} />
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          snapPoints={snapPoints}
          onChange={newIndex => {
            if (newIndex === 1) {
              headerTitleOpacity.stopAnimation(() => {
                RNAnimated.timing(headerTitleOpacity, {
                  toValue: 1,
                  duration: HEADER_ANIMATION_DURATION,
                  useNativeDriver: true,
                }).start();
                DeviceEventEmitter.emit(PAUSE_HEADER_VIDEO_EVENT, true);
                DeviceEventEmitter.emit(HIDE_HEADER_CONTENT, true);
              });
            } else {
              headerTitleOpacity.stopAnimation(() => {
                RNAnimated.timing(headerTitleOpacity, {
                  toValue: 0,
                  duration: HEADER_ANIMATION_DURATION,
                  useNativeDriver: true,
                }).start();
                DeviceEventEmitter.emit(PAUSE_HEADER_VIDEO_EVENT, false);
                DeviceEventEmitter.emit(HIDE_HEADER_CONTENT, false);
              });
            }
          }}
          handleStyle={{
            borderTopLeftRadius: constants.layout.radius.lg,
            borderTopRightRadius: constants.layout.radius.lg,
            backgroundColor: colors.card,
            paddingBottom: 0,
          }}
          handleIndicatorStyle={{
            backgroundColor: colors.text,
          }}
          backgroundStyle={{ backgroundColor: colors.background }}>
          <MaterialTopTab.Navigator
            screenOptions={{
              lazy: true,
              swipeEnabled: false, // This doesn't work anyway
              tabBarLabelStyle: constants.font.defaultTopTabBarLabelStyle,
              tabBarActiveTintColor: colors.primary,
              tabBarInactiveTintColor: colors.caption,
              tabBarPressColor: colors.highlight,
              // lazyPreloadDistance: 1,
              lazyPlaceholder: () => (
                <LoadingContainer
                  justifyContentToCenter={false}
                  containerStyle={[
                    profileDetailsContentCommonTabStyles.container,
                    { paddingTop: constants.layout.spacing.xxl },
                  ]}
                />
              ),
            }}>
            {profile.kind === 'vendor' && (
              <MaterialTopTab.Screen
                name="ProductDetailsProductsTab"
                component={ProfileDetailsContentProductsTab}
                options={{ tabBarLabel: 'Products' }}
              />
            )}
            <MaterialTopTab.Screen
              name="ProductDetailsPostsTab"
              component={ProfileDetailsContentPostsTab}
              options={{ tabBarLabel: 'Posts' }}
            />
            <MaterialTopTab.Screen
              name="ProductDetailsLikedTab"
              component={ProfileDetailsContentLikedTab}
              options={{ tabBarLabel: 'Liked' }}
            />
          </MaterialTopTab.Navigator>
        </BottomSheet>
        <ActionBottomSheet
          ref={actionBottomSheetRef}
          items={actionBottomSheetItems}
          onSelectItem={handleSelectActionItem}
        />
      </SafeAreaView>
    </ProfileDetailsContext.Provider>
  );
}

type ProfileDetailsHeaderProps = {
  preferredWindowHeight?: number;
};

function ProfileDetailsHeader(props: ProfileDetailsHeaderProps) {
  const $FUNC = '[ProfileDetailsHeader]';
  const { profile, isMyProfile } = React.useContext(ProfileDetailsContext);

  const { height: calculatedWindowHeight } = useWindowDimensions();
  const { colors, dark } = useExtendedTheme();

  const windowHeight = React.useMemo(() => {
    if (props.preferredWindowHeight) return props.preferredWindowHeight;
    return calculatedWindowHeight;
  }, [calculatedWindowHeight, props.preferredWindowHeight]);

  const dispatch = useAppDispatch();
  const navigation = useNavigation<RootStackNavigationProp>();

  const videoRef = React.useRef<Video>(null);
  const [isVideoPaused, setIsVideoPaused] = React.useState(false);
  const [fallbackToImage, setFallbackToImage] = React.useState(false);

  const headerHeight = useHeaderHeight();
  const avatarHeight = windowHeight * 0.13;

  const headerContentOpacity = useSharedValue(1);
  const headerContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(headerContentOpacity.value, [0, 1], [0, 1]),
  }));

  const currentUserProfileId = useAppSelector(state => {
    return authSlice.selectCurrentUserProfileId(state);
  });

  const isFollowing = React.useMemo(() => {
    if (isMyProfile) return false;
    if (!profile.followers) return false;
    if (!currentUserProfileId) return false;
    return profile.followers.includes(currentUserProfileId);
  }, [currentUserProfileId, isMyProfile, profile.followers]);

  // FIXME: For some reason this isn't working
  // const isFollowing = useAppSelector(state => {
  //   if (isMyProfile) return false;
  //   return profilesSlice.selectIsUserFollowingProfile(state, profile.id);
  // });

  const isFollowed = useAppSelector(state => {
    if (!currentUserProfileId) return false;
    if (isMyProfile) return false;
    const myProfile = profilesSlice.selectProfileById(
      state,
      currentUserProfileId,
    );
    return myProfile?.followers?.some(id => id === profile.profileId) ?? false;
  });

  const totalLikes = useAppSelector(state => {
    return postsSlice
      .selectPostsByProfile(state, profile.profileId)
      .map(post => post.statistics?.totalLikes ?? 0)
      .reduce((acc, curr) => acc + curr, 0);
  });

  useFocusEffect(
    React.useCallback(() => {
      // FIXME: Video starts playing when header is collapsed after navigating
      // to another screen on the stack and going back.
      // NOTE: If we add a `if (!isVideoPaused)` check on the next line, the
      // video pauses when pushing another screen to the stack, even if the
      // header is expanded.
      setIsVideoPaused(false);
      return () => setIsVideoPaused(true);
    }, []),
  );

  React.useEffect(() => {
    const playHeaderVideoFullscreenListener = DeviceEventEmitter.addListener(
      PLAY_HEADER_VIDEO_FULLSCREEN_EVENT,
      () => {
        // FIXME: This doesn't work on Android
        if (Platform.OS === 'android') {
          utilities.alertUnavailableFeature({
            message: "This feature isn't available for Android yet",
          });
          return;
        }

        videoRef.current?.presentFullscreenPlayer();
      },
    );

    const pauseHeaderVideoListener = DeviceEventEmitter.addListener(
      PAUSE_HEADER_VIDEO_EVENT,
      shouldPause => setIsVideoPaused(Boolean(shouldPause)),
    );

    const hideHeaderListener = DeviceEventEmitter.addListener(
      HIDE_HEADER_CONTENT,
      shouldHide =>
        (headerContentOpacity.value = withTiming(Boolean(shouldHide) ? 0 : 1, {
          duration: HEADER_ANIMATION_DURATION,
        })),
    );

    return () => {
      playHeaderVideoFullscreenListener.remove();
      pauseHeaderVideoListener.remove();
      hideHeaderListener.remove();
    };
  }, [headerContentOpacity]);

  const handleNavigateToFollowActivity = (
    selector: 'followers' | 'following',
  ) => {
    navigation.push('ProfileFollowActivity', {
      profileId: profile.profileId,
      selector,
    });
  };

  const handlePressEditProfile = () => {
    navigation.navigate('ProfileSettings');
  };

  const handlePressFollow = async (didFollow: boolean) => {
    const action = didFollow ? 'follow' : 'unfollow';

    try {
      if (!currentUserProfileId) {
        console.warn(
          $FUNC,
          'No profile ID was found for the current user, which is unexpected.',
          'Aborting `updateProfileFollowStatus` action...',
        );
        throw new Error('Failed to find profile for the current user');
      }

      console.log($FUNC, `Will ${action} profile...`);

      const updateProfileFollowStatusAction =
        profilesSlice.updateProfileFollowStatus({
          didFollow,
          followeeId: profile.profileId,
          followerId: currentUserProfileId,
        });

      await dispatch(updateProfileFollowStatusAction).unwrap();
      console.log($FUNC, `Successfully ${action}ed profile`);
    } catch (error) {
      console.error($FUNC, `Failed to ${action} user:`, error);
      utilities.alertSomethingWentWrong();
      throw error; // Rethrow the error to toggle the button back
    }
  };

  return (
    <View
      style={[
        profileDetailsHeaderStyles.headerContainer,
        { height: windowHeight * HEADER_HEIGHT_RATIO + BOTTOM_SHEET_NUDGE },
      ]}>
      {!fallbackToImage && profile.background?.mime.includes('video') ? (
        <>
          {Platform.OS === 'android' && (
            <FastImage
              source={{ uri: profile.backgroundThumbnail?.url }}
              style={[
                profileDetailsHeaderStyles.coverPhoto,
                { position: 'absolute', backgroundColor: colors.placeholder },
              ]}
            />
          )}
          <Video
            muted
            repeat
            ref={videoRef}
            paused={isVideoPaused}
            playWhenInactive
            playInBackground
            resizeMode="cover"
            posterResizeMode="cover"
            onError={({ error }) => {
              console.warn('Failed to load video:', error);
              setFallbackToImage(true);
            }}
            preventsDisplaySleepDuringVideoPlayback={false}
            source={{ uri: profile.background.url }}
            poster={profile.backgroundThumbnail?.url}
            style={[
              profileDetailsHeaderStyles.coverPhoto,
              {
                backgroundColor: Platform.select({
                  android: 'transparent',
                  default: colors.placeholder,
                }),
              },
            ]}
            onFullscreenPlayerDidDismiss={() => {
              // A "hack" to force the video to continue playing when the
              // fullscreen player is dismissed. The video will still pause for
              // a really short period, but it's not too noticeable.
              // https://github.com/react-native-video/react-native-video/issues/2279#issuecomment-778127819
              setIsVideoPaused(true);
              setTimeout(() => {
                setIsVideoPaused(false);
              }, 0);
            }}
          />
        </>
      ) : (
        <FastImage
          resizeMode="cover"
          tintColor={
            fallbackToImage || !profile.background
              ? dark
                ? constants.color.gray300
                : constants.color.gray500
              : undefined
          }
          source={
            !fallbackToImage && profile.background
              ? { uri: profile.background?.url }
              : constants.media.DEFAULT_IMAGE
          }
          style={[
            profileDetailsHeaderStyles.coverPhoto,
            profile.background && { backgroundColor: colors.placeholder },
          ]}
        />
      )}
      <View
        style={[
          profileDetailsHeaderStyles.headerInsetContainer,
          { paddingTop: headerHeight / 4 },
          { paddingBottom: BOTTOM_SHEET_NUDGE },
        ]}>
        <Animated.View
          style={[
            headerContentStyle,
            profileDetailsHeaderStyles.headerContentContainer,
          ]}>
          <View style={profileDetailsHeaderStyles.headerTextContainer}>
            <FastImage
              source={
                profile.avatar
                  ? { uri: profile.avatar.url }
                  : constants.media.DEFAULT_AVATAR
              }
              style={[
                profileDetailsHeaderStyles.avatar,
                { height: avatarHeight, borderRadius: avatarHeight / 2 },
                { backgroundColor: colors.placeholder },
                // Platform.OS === 'android' && { backgroundColor: 'transparent' },
              ]}
            />
            <Spacer.Vertical value="sm" />
            <Text
              style={[
                constants.font.extraLargeBold,
                profileDetailsHeaderStyles.headerText,
                { fontSize: constants.font.size.h3 },
              ]}>
              {profile.__publicName}
            </Text>
            <Spacer.Vertical value="xs" />
            <Text
              style={[
                constants.font.mediumBold,
                profileDetailsHeaderStyles.headerText,
              ]}>
              @{profile.username}
            </Text>
            {profile.biography && (
              <>
                <Spacer.Vertical value="xs" />
                <Text
                  numberOfLines={2}
                  style={[
                    constants.font.small,
                    profileDetailsHeaderStyles.headerText,
                  ]}>
                  {profile.biography}
                </Text>
              </>
            )}
          </View>
          <Spacer.Vertical value="md" />
          <View style={profileDetailsHeaderStyles.headerStatisticsContainer}>
            <ProfileDetailsHeaderStatistics
              label="Followers"
              count={profile.followers?.length ?? 0}
              onPress={() => handleNavigateToFollowActivity('followers')}
            />
            <ProfileDetailsHeaderStatistics
              label="Following"
              count={profile.following?.length ?? 0}
              onPress={() => handleNavigateToFollowActivity('following')}
            />
            <ProfileDetailsHeaderStatistics label="Likes" count={totalLikes} />
          </View>
          <Spacer.Vertical value="md" />
          {isMyProfile ? (
            <Button
              title="Edit My Profile"
              size="medium"
              variant="contained"
              containerStyle={profileDetailsHeaderStyles.headerButton}
              onPress={handlePressEditProfile}
            />
          ) : (
            <ToggleButton
              size="medium"
              title={isToggled =>
                isToggled ? 'Following' : isFollowed ? 'Follow Back' : 'Follow'
              }
              initialState={isFollowing}
              underlayColor={isToggled =>
                isToggled
                  ? constants.color.accentFocused
                  : constants.color.gray200
              }
              textStyle={isToggled => [
                {
                  color: isToggled
                    ? constants.color.defaultLightTextColor
                    : constants.color.defaultDarkTextColor,
                },
              ]}
              loadingIndicatorColor={isToggled =>
                isToggled
                  ? constants.color.defaultLightTextColor
                  : constants.color.defaultDarkTextColor
              }
              containerStyle={isToggled => [
                profileDetailsHeaderStyles.headerButton,
                {
                  backgroundColor: isToggled
                    ? constants.color.accent
                    : constants.color.gray100,
                },
              ]}
              onPress={handlePressFollow}
            />
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const profileDetailsHeaderStyles = StyleSheet.create({
  avatar: {
    aspectRatio: 1,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    width: '100%',
    height: '55%',
  },
  headerInsetContainer: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    justifyContent: 'center',
    paddingHorizontal: constants.layout.spacing.lg,
    backgroundColor: constants.color.absoluteBlack + '70',
  },
  headerContentContainer: {
    alignItems: 'center',
    paddingHorizontal: constants.layout.spacing.lg,
  },
  headerTextContainer: {
    flexGrow: 1,
    flexShrink: 1,
    alignItems: 'center',
  },
  headerText: {
    textAlign: 'center',
    color: constants.color.defaultLightTextColor,
  },
  headerStatisticsContainer: {
    flexDirection: 'row',
  },
  headerButton: {
    width: '75%',
    borderWidth: 0,
  },
});

type ProfileDetailsHeaderStatisticProps = {
  label: string;
  count: number;
  onPress?: () => void;
};

function ProfileDetailsHeaderStatistics(
  props: ProfileDetailsHeaderStatisticProps,
) {
  const { label, count, onPress } = props;
  return (
    <TouchableOpacity
      activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
      style={profileDetailsHeaderStatisticStyles.container}
      onPress={onPress}>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={profileDetailsHeaderStatisticStyles.label}>
        {label}
      </Text>
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={profileDetailsHeaderStatisticStyles.count}>
        {utilities.shortenLargeNumber(count)}
      </Text>
    </TouchableOpacity>
  );
}

const profileDetailsHeaderStatisticStyles = StyleSheet.create({
  container: {
    width: 80,
  },
  label: {
    ...constants.font.small,
    textAlign: 'center',
    color: constants.color.white,
  },
  count: {
    ...constants.font.extraLargeBold,
    textAlign: 'center',
    color: constants.color.white,
  },
});

function ProfileDetailsContentProductsTab() {
  const $FUNC = '[ProfileDetailsContentProductsTab]';
  const { profile, isMyProfile } = React.useContext(ProfileDetailsContext);
  const { colors } = useExtendedTheme();

  const productIds = useAppSelector(state => {
    // There shouldn't be a case where we encounter a personal profile here
    if (profile.kind !== 'vendor') return [];
    return productsSlice
      .selectProductsForVendor(state, profile.id)
      .map(product => product.id);
  });

  const dispatch = useAppDispatch();
  const navigation = useNavigation<ProfileDetailsScreenProps['navigation']>();
  const isMounted = useIsMounted();

  const [shouldFetch, setShouldFetch] = useShouldFetchOnFocus();

  React.useEffect(
    () => {
      async function fetchProducts() {
        try {
          console.log(
            $FUNC,
            `Fetching products for profile '${profile.profileId}'`,
          );

          if (profile.kind !== 'vendor') return;
          const action = productsSlice.fetchProductsForVendorProfile({
            vendorProfileId: profile.id,
          });

          await dispatch(action).unwrap();
        } catch (error) {
          console.error($FUNC, 'Failed to fetch products:', error);
          utilities.alertSomethingWentWrong(
            "We weren't able to fetch products for this profile at this time. " +
              'Please try again later.',
          );
        } finally {
          if (isMounted.current) setShouldFetch(false);
        }
      }

      if (shouldFetch) fetchProducts();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, shouldFetch],
  );

  const handleNavigateToCreateProduct = () => {
    navigation.navigate('Create', {
      screen: 'CreateItemDetails',
      params: { screen: 'CreateProduct' },
    });
  };

  return (
    <ProductMasonryList
      smallContent
      productIds={productIds}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: constants.layout.spacing.md,
      }}
      // @ts-ignore
      ScrollViewComponent={BottomSheetScrollView}
      ListEmptyComponent={
        shouldFetch ? (
          <LoadingContainer
            justifyContentToCenter={false}
            containerStyle={[
              profileDetailsContentCommonTabStyles.container,
              { paddingTop: constants.layout.spacing.xxl },
            ]}
          />
        ) : (
          <EmptyContainer
            justifyContentToCenter={false}
            message={`${
              isMyProfile ? "You haven't uploaded" : "This user doesn't have"
            } any products yet`}
            actionButtonType="primary"
            actionTitle={isMyProfile ? 'Upload a product' : undefined}
            actionOnPress={handleNavigateToCreateProduct}
            containerStyle={profileDetailsContentCommonTabStyles.container}
          />
        )
      }
    />
  );
}

function ProfileDetailsContentPostsTab() {
  const $FUNC = '[ProfileDetailsContentPostsTab]';
  const { profile, isMyProfile } = React.useContext(ProfileDetailsContext);

  const postIds = useAppSelector(state => {
    return postsSlice
      .selectPostsByProfile(state, profile.profileId)
      .map(post => post.id);
  });

  const dispatch = useAppDispatch();
  const navigation = useNavigation<ProfileDetailsScreenProps['navigation']>();
  const isMounted = useIsMounted();
  const { colors } = useExtendedTheme();

  const [shouldFetch, setShouldFetch] = useShouldFetchOnFocus();

  React.useEffect(
    () => {
      async function fetchPostsForProfile() {
        try {
          console.log(
            $FUNC,
            `Fetching posts for profile '${profile.profileId}'...`,
          );

          const fetchPostsAction = postsSlice.fetchPostsForProfile({
            reload: true,
            profileId: profile.profileId,
            // This is ignored by the API for now
            pagination: { currentPage: 0, limit: 25 },
          });

          await dispatch(fetchPostsAction).unwrap();
          console.log($FUNC, 'Finished fetching posts for profile');
        } catch (error: any) {
          console.error($FUNC, 'Failed to fetch posts for profile:', error);
          utilities.alertSomethingWentWrong(error.message);
        } finally {
          if (isMounted.current) setShouldFetch(false);
        }
      }

      if (shouldFetch) fetchPostsForProfile();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, shouldFetch],
  );

  const handleNavigateToCreateTextPost = () => {
    navigation.navigate('Create', {
      screen: 'CreateItemDetails',
      params: { screen: 'CreateTextPost' },
    });
  };

  return (
    <PostMasonryList
      smallContent
      postIds={postIds}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: constants.layout.spacing.md,
      }}
      // @ts-ignore We'll ignore the error for now
      ScrollViewComponent={BottomSheetScrollView}
      ListEmptyComponent={() =>
        shouldFetch ? (
          <LoadingContainer
            justifyContentToCenter={false}
            containerStyle={[
              profileDetailsContentCommonTabStyles.container,
              { paddingTop: constants.layout.spacing.xxl },
            ]}
          />
        ) : (
          <EmptyContainer
            justifyContentToCenter={false}
            message={`${
              isMyProfile ? "You haven't" : "This user hasn't"
            } posted anything yet`}
            actionButtonType="primary"
            actionTitle={isMyProfile ? 'Create a new post' : undefined}
            actionOnPress={handleNavigateToCreateTextPost}
            containerStyle={profileDetailsContentCommonTabStyles.container}
          />
        )
      }
    />
  );
}

function ProfileDetailsContentLikedTab() {
  const $FUNC = '[ProfileDetailsContentLikedTab]';
  const { profile, isMyProfile } = React.useContext(ProfileDetailsContext);

  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();
  const { colors } = useExtendedTheme();

  const [likedPostIds, setLikedPostIds] = React.useState<PostId[]>([]);
  const [shouldFetch, setShouldFetch] = useShouldFetchOnFocus();

  React.useEffect(
    () => {
      async function fetchLikedPostsForProfile() {
        try {
          console.log(
            $FUNC,
            `Fetching liked posts for profile '${profile.profileId}'...`,
          );

          const posts = await dispatch(
            postsSlice.fetchLikedPostsForProfile({
              profileId: profile.profileId,
              pagination: { currentPage: 0, limit: 25 },
            }),
          ).unwrap();

          setLikedPostIds(posts.map(post => post.id));
        } catch (error) {
          console.error($FUNC, 'Failed to fetch liked posts:', error);
          utilities.alertSomethingWentWrong();
        } finally {
          if (isMounted.current) setShouldFetch(false);
        }
      }

      if (shouldFetch) fetchLikedPostsForProfile();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch, shouldFetch],
  );

  return (
    <PostMasonryList
      smallContent
      postIds={likedPostIds}
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: constants.layout.spacing.md,
      }}
      // @ts-ignore
      ScrollViewComponent={BottomSheetScrollView}
      ListEmptyComponent={
        shouldFetch ? (
          <LoadingContainer
            justifyContentToCenter={false}
            containerStyle={[
              profileDetailsContentCommonTabStyles.container,
              { paddingTop: constants.layout.spacing.xxl },
            ]}
          />
        ) : (
          <EmptyContainer
            justifyContentToCenter={false}
            message={`${
              isMyProfile ? "You haven't" : "This user hasn't"
            } liked any posts yet`}
            containerStyle={profileDetailsContentCommonTabStyles.container}
          />
        )
      }
    />
  );
}

const profileDetailsContentCommonTabStyles = StyleSheet.create({
  container: {
    paddingTop: constants.layout.spacing.xl,
  },
});
