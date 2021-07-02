import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useDispatch, useSelector } from 'react-redux';

import GeoLocation from 'react-native-geolocation-service';

import {
  check as checkPermission,
  request as requestPermission,
  openSettings,
  PERMISSIONS,
} from 'react-native-permissions';

import { MerchantApi } from '../../api';
import { SOMETHING_WENT_WRONG } from '../../constants/strings';
import { fetchAllProfiles } from '../profiles/profilesSlice';

import PostItemCard from './PostItemCard';
import MerchantItemCard from '../merchants/MerchantItemCard';
import PostMasonryList from '../../components/masonry/PostMasonryList';
import SearchLocationModal from '../../components/bottomSheets/SearchLocationModal';

import { colors, typography, values } from '../../constants';

import {
  Button,
  EmptyTabView,
  ErrorTabView,
  MasonryList,
} from '../../components';

import {
  fetchAllPosts,
  selectFollowingPosts,
  selectPostIds,
} from './postsSlice';

// const PAGINATION_LIMIT = 26;
// const DEFAULT_SEARCH_RADIUS = 3;

const FeedTab = createMaterialTopTabNavigator();

/** @type {import('react-native').ViewStyle} */
const tabViewStyles = {
  flexGrow: 1,
  paddingHorizontal: values.spacing.lg,
};

/**
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {{ message?: string } & ViewProps} param0
 */
function MasonryListFooter({ message = "You're all caught up! 😎", ...props }) {
  return (
    <View style={[{ paddingVertical: values.spacing.xl }, props.style]}>
      <Text
        style={{
          color: colors.black,
          textAlign: 'center',
          fontWeight: '600',
          fontSize: typography.size.lg,
        }}>
        {message}
      </Text>
    </View>
  );
}

function DiscoverTab() {
  const dispatch = useDispatch();

  const postIds = useSelector(selectPostIds);

  /** @type {import('../../api').ApiFetchStatus} */
  const { error: fetchError } = useSelector((state) => state.posts);

  const [currentPage, setCurrentPage] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(true);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  // const handleFetchMorePosts = () => {
  //   if (!shouldRefresh) setCurrentPage((prev) => prev + 1);
  // };

  useEffect(() => {
    const refreshPosts = async () => {
      try {
        console.log('Refreshing posts and profiles...');
        await Promise.all([
          dispatch(fetchAllPosts()).unwrap(),
          dispatch(fetchAllProfiles()).unwrap(),
        ]);
      } catch (error) {
        console.error('[HomeScreen] Failed to refresh posts:', error);
        Alert.alert(
          'Something went wrong',
          "We couldn't refresh your posts for you at the moment.",
        );
      } finally {
        setShouldRefresh(false);
      }
    };

    if (shouldRefresh) refreshPosts();
  }, [shouldRefresh, dispatch]);

  useEffect(() => {
    const fetchMorePosts = async () => {
      // console.warn('Unimplemented: HomeScreen.fetchMorePosts');
      // try {
      //   setIsFetchingMore(true);
      //   /** @type {import('../../models').Post[]} */
      //   const posts = await dispatch(
      //     fetchAllPosts({ limit: PAGINATION_LIMIT, currentPage }),
      //   ).then(unwrapResult);
      //
      //   if (posts.length === 0) {
      //     Alert.alert(
      //       "You're all caught up!",
      //       "Looks like you've reached the end",
      //     );
      //   } else {
      //     await dispatch(fetchAllProfiles()).unwrap();
      //     setCurrentPage((prev) => prev + 1);
      //   }
      // } catch (error) {
      //   console.error('[HomeScreen] Failed to fetch more posts:', error);
      //   Alert.alert(
      //     'Something went wrong',
      //     "We couldn't fetch more posts for you",
      //   );
      // } finally {
      //   setIsFetchingMore(false);
      // }
    };

    if (!shouldRefresh && !isFetchingMore) fetchMorePosts();
  }, [currentPage, dispatch]);

  return (
    <PostMasonryList
      smallContent
      postIds={postIds}
      ListEmptyComponent={
        fetchError ? (
          <ErrorTabView error={fetchError} />
        ) : (
          <EmptyTabView message="Looks like no one has posted yet" />
        )
      }
      ListFooterComponent={postIds.length > 0 && <MasonryListFooter />}
      refreshControl={
        <RefreshControl
          title="Loading your personalised feed..."
          tintColor={colors.gray500}
          refreshing={shouldRefresh}
          onRefresh={handleRefresh}
        />
      }
    />
  );
}

function NearMeTab() {
  /**
   * @typedef {import('../settings/settingsSlice').AppSettings} AppSettings
   * @type {AppSettings}
   */
  const { locationSettings } = useSelector((state) => state.settings);
  console.log({ locationSettings });

  /**
   * NOTE: For now, we'll just fetch merchants
   * @typedef {import('../../models').Merchant} Merchant
   * @type {[Merchant[], (value: Merchant) => void]}
   */
  const [nearMeItems, setNearMeItems] = useState([]);

  /**
   * @typedef {{ latitude: number, longitude: number }} CurrentLocation
   * @type {[CurrentLocation, (value: CurrentLocation) => void]}
   */
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isGrantedPermission, setIsGrantedPermission] = useState(false);

  const [shouldFetch, setShouldFetch] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  /**
   * @typedef {import('@gorhom/bottom-sheet').BottomSheetModal} BottomSheetModal
   * @type {React.MutableRefObject<BottomSheetModal | null>} */
  const bottomSheetModalRef = useRef(null);

  useEffect(() => {
    const requestAuthorization_iOS = async () => {
      const result = await GeoLocation.requestAuthorization('whenInUse');
      console.log('[NearMeTab] iOS location authorization result:', result);
      setIsGrantedPermission(['granted', 'restricted'].includes(result));
    };

    const requestAuthorization_Android = async () => {
      const checkResult = await checkPermission(
        PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
      );

      console.log('[NearMeTab] Android check permission:', checkResult);
      if (['granted', 'limited'].includes(checkResult)) {
        setIsGrantedPermission(true);
      }

      const requestResult = await requestPermission(
        PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
      );

      console.log('[NearMeTab] Android request permission:', requestResult);
      setIsGrantedPermission(['granted', 'limited'].includes(requestResult));
    };

    if (Platform.OS === 'ios') {
      requestAuthorization_iOS();
    } else if (Platform.OS === 'android') {
      requestAuthorization_Android();
    } else {
      console.warn('[NearMeTab] Unsupported platform:', Platform.OS);
      setIsGrantedPermission(false);
    }
  }, [shouldFetch]);

  useEffect(() => {
    if (isGrantedPermission) {
      GeoLocation.getCurrentPosition(
        (position) => {
          console.log('Successfully got current position:', position);
          setCurrentLocation(position.coords);
        },
        (error) => {
          console.error('Failed to get current position:', error);
          setCurrentLocation(null);
          setShouldFetch(false);
          setFetchError(error);
        },
        { timeout: 15000, maximumAge: 10000 },
      );
    } else {
      setCurrentLocation(null);
      console.warn('Not granted permission');
    }
  }, [isGrantedPermission]);

  useEffect(() => {
    const fetchNearMeItems = async () => {
      try {
        console.log('[NearMeTab] Fetching near me items...');
        const items = await MerchantApi.fetchMerchantsNearMe({
          searchRadius: locationSettings?.searchRadius,
          coordinates: currentLocation,
        });
        setNearMeItems(items);
      } catch (error) {
        console.error('[NearMeTab] Failed to fetch near me items:', error);
        setFetchError(error);
      } finally {
        setShouldFetch(false);
      }
    };

    if (isGrantedPermission && currentLocation) {
      fetchNearMeItems();
    } else {
      setShouldFetch(false);
      setNearMeItems([]);
    }
  }, [/* isGrantedPermission, */ currentLocation]);

  const handleShowModal = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleRefresh = () => {
    if (!shouldFetch) setShouldFetch(true);
  };

  const handleOpenSettings = async () => {
    try {
      await openSettings();
    } catch (error) {
      console.error('[NearMeTab] Failed to open settings:', error);
      Alert.alert(
        SOMETHING_WENT_WRONG.title,
        "We weren't able to open the Settings app for you.",
      );
    }
  };

  const tileSpacing = values.spacing.sm * 1.25;

  return (
    <View style={{ flexGrow: 1 }}>
      <MasonryList
        data={nearMeItems}
        refreshControl={
          <RefreshControl
            title="Loading activity near you..."
            tintColor={colors.gray500}
            refreshing={shouldFetch}
            onRefresh={handleRefresh}
          />
        }
        ListEmptyComponent={
          !isGrantedPermission ? (
            <>
              <ErrorTabView
                message="We don't know where you are!"
                caption="Please allow Discovrr to use your location to view merchants and products near you."
              />
              <Button
                primary
                size="small"
                title="Open Settings"
                onPress={handleOpenSettings}
                style={{
                  width: 200,
                  alignSelf: 'center',
                  marginTop: values.spacing.lg,
                }}
              />
            </>
          ) : fetchError ? (
            <ErrorTabView
              message="We couldn't get your current location"
              error={fetchError}
            />
          ) : (
            <View
              style={{
                flexGrow: 1,
                justifyContent: 'center',
              }}>
              <EmptyTabView message="Looks like there isn't any activity near you" />
              <Button
                primary
                size="small"
                title="Change Search Location"
                onPress={handleShowModal}
                style={{
                  width: 200,
                  alignSelf: 'center',
                  marginTop: values.spacing.sm,
                }}
              />
            </View>
          )
        }
        ListFooterComponent={
          nearMeItems.length > 0 && (
            <>
              <MasonryListFooter
                message="Not what you're looking for?"
                style={{ paddingBottom: 0 }}
              />
              <Button
                primary
                size="small"
                title="Change Search Location"
                onPress={handleShowModal}
                style={{
                  width: 200,
                  alignSelf: 'center',
                  marginTop: values.spacing.md,
                  marginBottom: values.spacing.xl,
                }}
              />
            </>
          )
        }
        renderItem={({ item: merchant, index }) => (
          <MerchantItemCard
            merchant={merchant}
            key={merchant.id}
            style={{
              marginTop: tileSpacing,
              marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
              marginRight: index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
              marginBottom: values.spacing.sm,
            }}
          />
        )}
      />

      <SearchLocationModal ref={bottomSheetModalRef} />
    </View>
  );
}

// function NearMeTab() {
//   /**
//    * NOTE: For now, we'll just fetch merchants
//    * @typedef {import('../../models').Merchant} Merchant
//    * @type {[Merchant[], (value: Merchant) => void]}
//    */
//   const [nearMeItems, setNearMeItems] = useState([]);
//   const [shouldFetch, setShouldFetch] = useState(true);
//   const [fetchError, setFetchError] = useState(null);
//
//   useEffect(() => {
//     if (shouldFetch) {
//       (async () => {
//         try {
//           console.log('[NearMeTab] Fetching near me items...');
//           // Fetch items in default location - Redfern
//           const items = await MerchantApi.fetchMerchantsNearMe();
//           setNearMeItems(items);
//         } catch (error) {
//           console.error('[NearMeTab] Failed to fetch near me items:', error);
//           setFetchError(error);
//         } finally {
//           setShouldFetch(false);
//         }
//       })();
//     }
//   }, [shouldFetch]);
//
//   const handleRefresh = () => {
//     if (!shouldFetch) setShouldFetch(true);
//   };
//
//   const tileSpacing = values.spacing.sm * 1.25;
//
//   return (
//     <MasonryList
//       data={nearMeItems}
//       refreshControl={
//         <RefreshControl
//           title="Loading activity near you..."
//           tintColor={colors.gray500}
//           refreshing={shouldFetch}
//           onRefresh={handleRefresh}
//         />
//       }
//       ListEmptyComponent={
//         fetchError ? (
//           <ErrorTabView
//             message="We couldn't get your current location"
//             error={fetchError}
//           />
//         ) : (
//           <EmptyTabView message="Looks like there isn't any activity near you" />
//         )
//       }
//       ListFooterComponent={nearMeItems.length > 0 && <MasonryListFooter />}
//       renderItem={({ item: merchant, index }) => (
//         <MerchantItemCard
//           merchant={merchant}
//           key={merchant.id}
//           style={{
//             marginTop: tileSpacing,
//             marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
//             marginRight: index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
//             marginBottom: values.spacing.sm,
//           }}
//         />
//       )}
//     />
//   );
// }

function FollowingTab() {
  /** @type {import('../authentication/authSlice').AuthState} */
  const { user } = useSelector((state) => state.auth);
  if (!user) {
    console.warn('User not signed in');
  }

  const followingPostsIds = user
    ? useSelector((state) =>
        selectFollowingPosts(state, user.profile.id).map((post) => post.id),
      )
    : [];

  const isRefreshing = false;
  const handleRefresh = () => {};

  return (
    <FlatList
      data={followingPostsIds}
      keyExtractor={(postId) => String(postId)}
      style={{ backgroundColor: colors.white }}
      contentContainerStyle={{
        ...tabViewStyles,
        paddingVertical: values.spacing.md,
        paddingHorizontal: values.spacing.md,
      }}
      refreshControl={
        <RefreshControl
          title="Getting posts from people you follow..."
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.gray500]}
          tintColor={colors.gray500}
        />
      }
      ListEmptyComponent={
        <EmptyTabView
          message="You're not following anyone! Why not follow someone to see their posts here?"
          style={tabViewStyles}
        />
      }
      ListFooterComponent={
        followingPostsIds.length > 0 && <MasonryListFooter />
      }
      renderItem={({ item: postId }) => (
        <PostItemCard
          postId={postId}
          style={{ marginBottom: values.spacing.md * 1.25 }}
        />
      )}
    />
  );
}

export default function HomeScreen() {
  return (
    <FeedTab.Navigator
      lazy
      tabBarOptions={{
        labelStyle: { textTransform: 'none' },
        indicatorStyle: { backgroundColor: colors.accent },
      }}>
      <FeedTab.Screen name="Discover" component={DiscoverTab} />
      <FeedTab.Screen
        name="NearMe"
        component={NearMeTab}
        options={{ title: 'Near Me' }}
      />
      <FeedTab.Screen name="Following" component={FollowingTab} />
    </FeedTab.Navigator>
  );
}
