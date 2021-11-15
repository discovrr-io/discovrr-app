import * as React from 'react';
import {
  ActivityIndicator,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

// import Animated from 'react-native-reanimated';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/core';
import { useHeaderHeight } from '@react-navigation/elements';

import * as authSlice from 'src/features/authentication/auth-slice';
import * as postsSlice from 'src/features/posts/posts-slice';
import * as profilesSlice from 'src/features/profiles/profiles-slice';
import * as productsSlice from 'src/features/products/products-slice';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import PostMasonryList from 'src/features/posts/PostMasonryList';
import ProductMasonryList from 'src/features/products/ProductMasonryList';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { Profile } from 'src/models';
import { RootStackNavigationProp, RootStackScreenProps } from 'src/navigation';

import {
  ActionBottomSheet,
  ActionBottomSheetItem,
  AsyncGate,
  Button,
  EmptyContainer,
  LoadingContainer,
  PlaceholderScreen,
  RouteError,
  Spacer,
  ToggleButton,
} from 'src/components';

import { useIsMyProfile, useProfile } from './hooks';

const MaterialTopTab = createMaterialTopTabNavigator();
const BACKGROUND_COLOR = constants.color.gray100;

const ProfileDetailsContext = React.createContext<{
  profile: Profile;
  isMyProfile: boolean;
}>(null as any);

type ProfileDetailsScreenProps = RootStackScreenProps<'ProfileDetails'>;

export default function ProfileDetailsScreen(props: ProfileDetailsScreenProps) {
  const profileData = useProfile(props.route.params.profileId);
  const headerHeight = useHeaderHeight();

  const renderRouteError = (_error?: any) => (
    <RouteError containerStyle={{ backgroundColor: constants.color.white }} />
  );

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
          <LoadingContainer message="Loading profile..." />
        </SafeAreaView>
      )}
      onFulfilled={profile => {
        if (!profile) return renderRouteError();
        return <LoadedProfileDetailsScreen profile={profile} {...props} />;
      }}
      onRejected={renderRouteError}
    />
  );
}

type LoadedProfileDetailsScreenProps = ProfileDetailsScreenProps & {
  profile: Profile;
};

function LoadedProfileDetailsScreen(props: LoadedProfileDetailsScreenProps) {
  const { profile, navigation } = props;
  const { height: windowHeight } = useWindowDimensions();

  const isMyProfile = useIsMyProfile(profile.profileId);
  const headerHeight = useHeaderHeight();
  // const headerTitleOpacity = React.useRef(new Animated.Value(0)).current;

  const bottomSheetRef = React.useRef<BottomSheet>(null);
  const snapPoints = React.useMemo(
    () => [windowHeight * 0.45 + 24, windowHeight - headerHeight],
    [headerHeight, windowHeight],
  );

  const actionBottomSheetRef = React.useRef<BottomSheet>(null);
  const actionBottomSheetItems = React.useMemo(() => {
    const items: ActionBottomSheetItem[] = [];

    if (!isMyProfile) {
      const displayName = (() => {
        if (profile.kind === 'vendor') {
          return profile.businessName || profile.displayName;
        } else {
          return profile.displayName;
        }
      })();

      items.push(
        {
          id: 'block',
          label: `Block ${displayName}`,
          iconName: 'hand-right-outline',
          destructive: true,
        },
        {
          id: 'report',
          label: `Report ${profile.displayName}`,
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
      // headerTitleContainerStyle: {
      //   opacity: headerTitleOpacity.interpolate({
      //     inputRange: [0, 1],
      //     outputRange: [0, 1],
      //   }),
      // },
      headerRight: ({ tintColor }) => (
        <TouchableOpacity
          activeOpacity={constants.values.DEFAULT_ACTIVE_OPACITY}
          onPress={() => actionBottomSheetRef.current?.expand()}
          style={{
            marginRight: constants.layout.defaultScreenMargins.horizontal,
          }}>
          <Icon
            name={Platform.select({
              android: 'ellipsis-vertical',
              default: 'ellipsis-horizontal',
            })}
            size={24}
            color={tintColor || constants.color.black}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useFocusEffect(
    React.useCallback(() => {
      if (true || Platform.OS === 'ios') {
        // console.log('FOCUS');
        StatusBar.setBarStyle('light-content', true);
      }

      return () => {
        if (true || Platform.OS === 'ios') {
          // console.log('BLUR');
          StatusBar.setBarStyle('dark-content', true);
        }
      };
    }, []),
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
      {Platform.OS === 'ios' && <StatusBar animated barStyle="light-content" />}
      <SafeAreaView edges={['bottom', 'left', 'right']} style={{ flex: 1 }}>
        <ProfileDetailsHeader />
        <LinearGradient
          colors={[
            constants.color.absoluteBlack + 'A0', // alpha channel
            constants.color.absoluteBlack + '00', // alpha channel
          ]}
          style={{
            position: 'absolute',
            width: '100%',
            height: headerHeight * 1.25,
          }}
        />
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={constants.color.gray500} />
        </View>
        <BottomSheet
          ref={bottomSheetRef}
          // animateOnMount={false}
          // onChange={index => console.log('CHANGE:', index)}
          // onAnimate={(from, to) => console.log('ANIMATE:', { from, to })}
          snapPoints={snapPoints}
          handleStyle={{
            backgroundColor: constants.color.absoluteWhite,
            borderTopLeftRadius: constants.layout.radius.md,
            borderTopRightRadius: constants.layout.radius.md,
          }}
          backgroundStyle={{ backgroundColor: BACKGROUND_COLOR }}>
          <MaterialTopTab.Navigator
            screenOptions={{
              lazy: true,
              // lazyPreloadDistance: 1,
              lazyPlaceholder: () => (
                <LoadingContainer
                  justifyContentToCenter={false}
                  containerStyle={
                    profileDetailsContentCommonTabStyles.container
                  }
                />
              ),
              tabBarLabelStyle: constants.font.defaultTabBarLabelStyle,
              tabBarActiveTintColor: constants.color.accent,
              tabBarInactiveTintColor: constants.color.gray500,
              tabBarPressColor: constants.color.gray200,
              tabBarStyle: {
                backgroundColor: constants.color.absoluteWhite,
              },
            }}>
            {profile.kind === 'vendor' && (
              <MaterialTopTab.Screen
                name="Products"
                component={ProfileDetailsContentProductsTab}
              />
            )}
            <MaterialTopTab.Screen
              name="Posts"
              component={ProfileDetailsContentPostsTab}
            />
            <MaterialTopTab.Screen
              name="Liked"
              component={ProfileDetailsContentLikedTab}
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

function ProfileDetailsHeader() {
  const $FUNC = '[ProfileDetailsHeader]';
  const { profile, isMyProfile } = React.useContext(ProfileDetailsContext);
  const { height: windowHeight } = useWindowDimensions();

  const dispatch = useAppDispatch();
  const navigation = useNavigation<RootStackNavigationProp>();

  const headerHeight = useHeaderHeight();
  const avatarHeight = windowHeight * 0.13;

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

  const handleNavigateToFollowActivity = (
    selector: 'followers' | 'following',
  ) => {
    navigation.push('ProfileFollowActivity', {
      profileId: profile.profileId,
      profileDisplayName: profile.displayName,
      selector,
    });
  };

  const handlePressEditProfile = () => {
    navigation.navigate('ProfileSettings');
  };

  const handlePressFollow = async (didFollow: boolean) => {
    const description = didFollow ? 'follow' : 'unfollow';

    try {
      if (!currentUserProfileId) {
        console.warn(
          $FUNC,
          'No profile ID was found for the current user, which is unexpected.',
          'Aborting `updateProfileFollowStatus` action...',
        );
        throw new Error('Failed to find profile for the current user');
      }

      console.log($FUNC, `Will ${description} profile...`);

      const updateProfileFollowStatusAction =
        profilesSlice.updateProfileFollowStatus({
          didFollow,
          followeeId: profile.profileId,
          followerId: currentUserProfileId,
        });

      await dispatch(updateProfileFollowStatusAction).unwrap();
      console.log($FUNC, `Successfully ${description}ed profile`);
    } catch (error) {
      console.error($FUNC, `Failed to ${description} user:`, error);
      utilities.alertSomethingWentWrong();
      throw error; // Rethrow the error to toggle the button back
    }
  };

  return (
    <View style={profileDetailsHeaderStyles.headerContainer}>
      <FastImage
        resizeMode="cover"
        source={
          profile.coverPhoto
            ? { uri: profile.coverPhoto.url }
            : constants.media.DEFAULT_IMAGE
        }
        style={profileDetailsHeaderStyles.coverPhoto}
      />
      <View
        style={[
          profileDetailsHeaderStyles.headerInsetContainer,
          { paddingTop: headerHeight / 2 },
        ]}>
        <View style={profileDetailsHeaderStyles.headerContentContainer}>
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
              ]}
            />
            <Spacer.Vertical value="sm" />
            <Text
              style={[
                constants.font.extraLargeBold,
                profileDetailsHeaderStyles.headerText,
                { fontSize: constants.font.size.h3 },
              ]}>
              {profile.displayName}
            </Text>
            <Text
              style={[
                constants.font.mediumBold,
                profileDetailsHeaderStyles.headerText,
              ]}>
              @{profile.username}
            </Text>
            {profile.biography && (
              <Text
                numberOfLines={2}
                style={[
                  constants.font.small,
                  profileDetailsHeaderStyles.headerText,
                ]}>
                {profile.biography}
              </Text>
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
                isToggled && { color: constants.color.defaultLightTextColor },
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
        </View>
      </View>
    </View>
  );
}

const profileDetailsHeaderStyles = StyleSheet.create({
  avatar: {
    aspectRatio: 1,
    backgroundColor: constants.color.placeholder,
  },
  coverPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: constants.color.placeholder,
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
    backgroundColor: constants.color.absoluteBlack + '80',
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
      <Text numberOfLines={1} style={profileDetailsHeaderStatisticStyles.label}>
        {label}
      </Text>
      <Text numberOfLines={1} style={profileDetailsHeaderStatisticStyles.count}>
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

function ProfileDetailsContentPostsTab() {
  const { profile } = React.useContext(ProfileDetailsContext);
  const postIds = useAppSelector(state => {
    return postsSlice
      .selectPostsByProfile(state, profile.profileId)
      .map(post => post.id);
  });

  const dispatch = useAppDispatch();
  const isMounted = useIsMounted();

  const [isInitialRender, setIsInitialRender] = React.useState(true);
  const [shouldRefresh, setShouldRefresh] = React.useState(false);

  React.useEffect(() => {
    async function fetchPostsForProfile() {
      try {
        console.log(`Refreshing profile with ID '${profile.profileId}'...`);

        const fetchProfileAction = profilesSlice.fetchProfileById({
          profileId: profile.profileId,
          reload: true,
        });

        const fetchPostsAction = postsSlice.fetchPostsForProfile({
          profileId: profile.profileId,
          reload: true,
        });

        await Promise.all([
          dispatch(fetchProfileAction).unwrap(),
          dispatch(fetchPostsAction).unwrap(),
        ]);

        console.log('Finished refreshing profile');
      } catch (error: any) {
        console.error('Failed to refresh profile:', error);
        utilities.alertSomethingWentWrong(error.message);
      } finally {
        if (isMounted.current) {
          if (isInitialRender) setIsInitialRender(false);
          if (shouldRefresh) setShouldRefresh(false);
        }
      }
    }

    const timer = setTimeout(() => {
      if (isInitialRender || shouldRefresh) fetchPostsForProfile();
    }, 1000);

    return () => clearTimeout(timer);
  }, [dispatch, profile.profileId, isInitialRender, shouldRefresh, isMounted]);

  return (
    <PostMasonryList
      smallContent
      postIds={postIds}
      style={{ backgroundColor: BACKGROUND_COLOR }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: constants.layout.spacing.md,
      }}
      // @ts-ignore We'll ignore the error for now
      ScrollViewComponent={BottomSheetScrollView}
      ListEmptyComponent={() =>
        isInitialRender ? (
          <LoadingContainer
            justifyContentToCenter={false}
            message="Loading posts…"
            containerStyle={[
              profileDetailsContentCommonTabStyles.container,
              { paddingTop: constants.layout.spacing.xxl },
            ]}
          />
        ) : (
          <EmptyContainer
            justifyContentToCenter={false}
            message="This user hasn't posted anything yet"
            containerStyle={profileDetailsContentCommonTabStyles.container}
          />
        )
      }
    />
  );
}

function ProfileDetailsContentProductsTab() {
  const { profile } = React.useContext(ProfileDetailsContext);

  const productIds = useAppSelector(state => {
    if (profile.kind !== 'vendor') return undefined;
    return productsSlice
      .selectProductsForVendor(state, profile.id)
      .map(product => product.id);
  });

  if (!productIds) {
    return <RouteError />;
  }

  return (
    <ProductMasonryList
      smallContent
      productIds={productIds}
      style={{ backgroundColor: BACKGROUND_COLOR }}
      contentContainerStyle={{
        flexGrow: 1,
        paddingBottom: constants.layout.spacing.md,
      }}
      // @ts-ignore
      ScrollViewComponent={BottomSheetScrollView}
      ListEmptyComponent={
        <EmptyContainer
          justifyContentToCenter={false}
          message="This user does not have any products yet"
          containerStyle={profileDetailsContentCommonTabStyles.container}
        />
      }
    />
  );
}

function ProfileDetailsContentLikedTab() {
  const { profile: _ } = React.useContext(ProfileDetailsContext);

  return (
    <PlaceholderScreen
      justifyContentToCenter={false}
      containerStyle={profileDetailsContentCommonTabStyles.container}
    />
  );
}

const profileDetailsContentCommonTabStyles = StyleSheet.create({
  container: {
    paddingTop: constants.layout.spacing.xl,
    backgroundColor: BACKGROUND_COLOR,
  },
});
