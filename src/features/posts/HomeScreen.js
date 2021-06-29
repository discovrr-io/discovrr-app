import React, { useEffect, useRef, useState } from 'react';
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
  PERMISSIONS,
  RESULTS,
} from 'react-native-permissions';

import { MerchantApi } from '../../api';
import { colors, values } from '../../constants';

import PostItemCard from './PostItemCard';
import MerchantItemCard from '../merchants/MerchantItemCard';
import PostMasonryList from '../../components/masonry/PostMasonryList';
import { EmptyTabView, ErrorTabView, MasonryList } from '../../components';

import { fetchAllProfiles } from '../profiles/profilesSlice';
import {
  fetchAllPosts,
  selectFollowingPosts,
  selectPostIds,
} from './postsSlice';

const PAGINATION_LIMIT = 26;
const DEFAULT_SEARCH_RADIUS = 3;

const FeedTab = createMaterialTopTabNavigator();

/** @type {import('react-native').ViewStyle} */
const tabViewStyles = {
  flexGrow: 1,
  paddingHorizontal: values.spacing.lg,
};

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
          "We couldn't refresh your posts for you",
        );
      } finally {
        setShouldRefresh(false);
      }
    };

    if (shouldRefresh) refreshPosts();
  }, [shouldRefresh, dispatch]);

  useEffect(() => {
    const fetchMorePosts = async () => {
      console.warn('Unimplemented: HomeScreen.fetchMorePosts');
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
          <EmptyTabView message="Looks like no one has posted anything yet" />
        )
      }
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

/**
 * @typedef {"unavailable" | "blocked" | "denied" | "granted" | "limited"} PermissionResult
 * @type {PermissionResult}
 */

/**
 * @template T, E
 * @typedef {{ type: 'success', payload: T } | { type: 'failure', payload: E }} Result
 */

async function canRequestLocation_iOS() {
  const result = await checkPermission(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
  console.log('Permission result:', result);
  return ['granted', 'limited', 'denied'].includes(result);
}

function NearMeTab() {
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

  const [shouldFetch, setShouldFetch] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const getCurrentLocation_iOS = async () => {
      const granted = await canRequestLocation_iOS();
      console.log('Is current location granted?', granted);
      if (!granted) {
        setCurrentLocation(null);
        setFetchError('Location permission not granted');
        return;
      }

      GeoLocation.getCurrentPosition(
        (position) => {
          console.log('Successfully got current position:', position);
          setCurrentLocation(position.coords);
          setIsGrantedPermission(true);
        },
        (error) => {
          console.error('Failed to get current position:', error);
          setFetchError(error);
        },
        { timeout: 15_000, maximumAge: 10_000 },
      );
    };

    if (Platform.OS === 'ios') {
      getCurrentLocation_iOS();
    } else if (Platform.OS === 'android') {
      console.warn('[NearMeTab] Unimplemented: Android GeoLocation');
    } else {
      console.warn('[NearMeTab] Unsupported platform:', Platform.OS);
    }
  }, []);

  useEffect(() => {
    const fetchNearMeItems = async () => {
      try {
        console.log('[NearMeTab] Fetching near me items...');
        const items = await MerchantApi.fetchMerchantsNearMe({
          coordinates: currentLocation,
        });
        setNearMeItems(items);
      } catch (error) {
        console.error(
          '[NearMeTab] Failed to fetch near me items:',
          JSON.stringify(error),
        );
        setFetchError(error);
      } finally {
        setShouldFetch(false);
      }
    };

    if (shouldFetch && isGrantedPermission) fetchNearMeItems();
  }, [shouldFetch, isGrantedPermission, currentLocation]);

  const handleRefresh = () => {
    if (!shouldFetch && isGrantedPermission) setShouldFetch(true);
  };

  const tileSpacing = values.spacing.sm * 1.25;

  return (
    <MasonryList
      data={nearMeItems}
      ListEmptyComponent={
        fetchError ? (
          <ErrorTabView
            message={
              !isGrantedPermission
                ? "We don't know where you are!"
                : "We couldn't get your current location"
            }
            caption={
              !isGrantedPermission &&
              'Please allow Discovrr to use your location to view merchants and products near you.'
            }
            error={fetchError}
          />
        ) : (
          <EmptyTabView message="Looks like there isn't any activity near you" />
        )
      }
      refreshControl={
        <RefreshControl
          title="Loading activity near you..."
          tintColor={colors.gray500}
          refreshing={shouldFetch}
          onRefresh={handleRefresh}
        />
      }
      renderItem={({ item: merchant, index }) => (
        <MerchantItemCard
          merchant={merchant}
          style={{
            marginTop: tileSpacing,
            marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
            marginRight: index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
            marginBottom: values.spacing.sm,
          }}
        />
      )}
    />
  );
}

// function NearMeTab() {
//   const [shouldFetch, setShouldFetch] = useState(true);

//   /**
//    * NOTE: For now, we'll just fetch merchants
//    * @typedef {import('../../models').Merchant[]} MerchantsGetter
//    * @typedef {(merchant: Merchant) => void} MerchantsSetter
//    * @type {[MerchantsGetter, MerchantsSetter]}
//    */
//   const [nearMeItems, setNearMeItems] = useState([]);
//   const [fetchError, setFetchError] = useState(null);

//   useEffect(() => {
//     if (shouldFetch)
//       (async () => {
//         try {
//           console.log('[NearMeTab] Fetching near me items...');
//           const items = await MerchantApi.fetchMerchantsNearMe();
//           setNearMeItems(items);
//         } catch (error) {
//           console.error('[NearMeTab] Failed to fetch near me items:', error);
//           setFetchError(error);
//         } finally {
//           setShouldFetch(false);
//         }
//       })();
//   }, [shouldFetch]);

//   const handleRefresh = () => {
//     if (!shouldFetch) setShouldFetch(true);
//   };

//   const tileSpacing = values.spacing.sm * 1.25;

//   return (
//     <MasonryList
//       data={nearMeItems}
//       renderItem={({ item: merchant, index }) => (
//         <MerchantItem
//           merchant={merchant}
//           style={{
//             marginTop: tileSpacing,
//             marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
//             marginRight: index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
//             marginBottom: values.spacing.sm,
//           }}
//         />
//       )}
//       ListEmptyComponent={
//         fetchError ? (
//           <ErrorTabView error={fetchError} />
//         ) : (
//           <EmptyTabView message="Looks like there isn't any activity near you" />
//         )
//       }
//       refreshControl={
//         <RefreshControl
//           tintColor={colors.gray500}
//           refreshing={shouldFetch}
//           onRefresh={handleRefresh}
//           title="Loading activity near you..."
//         />
//       }
//     />
//   );
// }

function FollowingTab() {
  // const dispatch = useDispatch();

  // const [followingPosts, setFollowingPosts] = useState([]);
  // const [isRefreshing, setIsRefreshing] = useState(true);

  // const handleRefresh = () => {
  //   if (!isRefreshing) setIsRefreshing(true);
  // };

  // useEffect(() => {
  //   const fetchData = async () => {
  //     try {
  //       console.log('Fetching following posts...');
  //       /** @type {import('../../models').Post[]} */
  //       const following = await dispatch(
  //         fetchFollowingPosts({ limit: PAGINATION_LIMIT }),
  //       ).unwrap();

  //       console.log('Following posts:', following);
  //       setFollowingPosts(following);
  //     } catch (error) {
  //       console.error('Failed to fetch following posts:', error);
  //       Alert.alert(
  //         'Something went wrong',
  //         "We weren't able to get posts from people you follow. Please try again later.",
  //       );
  //     } finally {
  //       setIsRefreshing(false);
  //     }
  //   };

  //   if (isRefreshing) fetchData();
  // }, [isRefreshing, dispatch]);

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
      renderItem={({ item: postId }) => (
        <PostItemCard
          postId={postId}
          style={{ marginBottom: values.spacing.md * 1 }}
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
