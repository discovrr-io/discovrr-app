import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { createSelector } from '@reduxjs/toolkit';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useDispatch, useSelector } from 'react-redux';

// import GeoLocation from 'react-native-geolocation-service';
// import {
//   check as checkPermission,
//   request as requestPermission,
//   openSettings,
//   PERMISSIONS,
// } from 'react-native-permissions';

import { SOMETHING_WENT_WRONG } from '../../constants/strings';
import { fetchAllProfiles } from '../profiles/profilesSlice';

import MerchantItemCard from '../merchants/MerchantItemCard';
import PostItemCard from './PostItemCard';
import PostMasonryList from '../../components/masonry/PostMasonryList';
import ProductItemCard from '../products/ProductItemCard';
// import SearchLocationModal from '../../components/bottomSheets/SearchLocationModal';

import { colors, typography, values } from '../../constants';
import { EmptyTabView, ErrorTabView, MasonryList } from '../../components';

import {
  fetchAllPosts,
  selectFollowingPosts,
  selectPostIds,
} from './postsSlice';

import {
  fetchAllMerchants,
  selectMerchantIds,
} from '../merchants/merchantsSlice';

import { fetchAllProducts, selectProductIds } from '../products/productsSlice';
import { ActivityIndicator } from 'react-native';
// import { StyleSheet } from 'react-native';

const PAGINATION_LIMIT = 24;

const FeedTab = createMaterialTopTabNavigator();

/** @type {import('react-native').ViewStyle} */
const tabViewStyles = {
  flexGrow: 1,
  paddingHorizontal: values.spacing.lg,
};

/**
 * @typedef {import('react-native').ViewProps} ViewProps
 * @param {{ message?: string, loading?: boolean } & ViewProps} param0
 */
function MasonryListFooter({
  message = "You're all caught up! 😎",
  loading = false,
  ...props
}) {
  return (
    <View style={[{ paddingVertical: values.spacing.xl }, props.style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.gray500}
            style={{ marginRight: values.spacing.md }}
          />
        )}
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
    </View>
  );
}

function DiscoverTab() {
  const FUNC = '[DiscoverTab]';
  const dispatch = useDispatch();

  const postIds = useSelector(selectPostIds);

  /** @type {import('../../api').ApiFetchStatus} */
  const { status: fetchStatus, error: fetchError } = useSelector(
    (state) => state.posts,
  );

  const [shouldRefresh, setShouldRefresh] = useState(true);
  const [shouldFetchMore, setShouldFetchMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [didReachEnd, setDidReachEnd] = useState(false);

  useEffect(() => {
    if (shouldRefresh)
      (async () => {
        try {
          setCurrentPage(0);
          setDidReachEnd(false);

          /** @type {import('../../models/common').Pagination} */
          const pagination = { limit: PAGINATION_LIMIT, currentPage: 0 };
          await Promise.all([
            dispatch(fetchAllPosts({ pagination, reload: true })).unwrap(),
            dispatch(fetchAllProfiles({ reload: true })).unwrap(),
          ]);
        } catch (error) {
          console.error(FUNC, 'Failed to refresh posts:', error);
          Alert.alert(
            SOMETHING_WENT_WRONG.title,
            "We couldn't refresh your posts for you at the moment.",
          );
        } finally {
          setShouldRefresh(false);
        }
      })();
  }, [shouldRefresh]);

  useEffect(() => {
    if (shouldFetchMore)
      (async () => {
        try {
          console.log(FUNC, 'Fetching more posts...');

          /** @type {import('../../models/common').Pagination} */
          const pagination = {
            limit: PAGINATION_LIMIT,
            currentPage: currentPage + 1,
          };

          const fetchAllPostsAction = fetchAllPosts({ pagination });

          const posts = await dispatch(fetchAllPostsAction).unwrap();
          console.log(FUNC, `Found ${posts.length} more post(s)`);

          if (posts.length === 0) {
            setDidReachEnd(true);
          } else {
            // TODO: Find a way to only fetch profiles from the loaded posts
            await dispatch(fetchAllProfiles()).unwrap();
            setCurrentPage(currentPage + 1);
          }
        } catch (error) {
          console.error(FUNC, 'Failed to fetch more posts:', error);
          Alert.alert(
            'Something went wrong',
            "We couldn't fetch more posts for you",
          );
        } finally {
          setShouldFetchMore(false);
        }
      })();
  }, [shouldFetchMore]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  const handleFetchMorePosts = () => {
    if (!shouldRefresh && !shouldFetchMore) setShouldFetchMore(true);
  };

  return (
    <PostMasonryList
      smallContent
      postIds={postIds}
      style={{ backgroundColor: colors.white }}
      onEndReached={handleFetchMorePosts}
      onEndReachedThreshold={0.85}
      refreshControl={
        <RefreshControl
          title="Loading your personalised feed..."
          tintColor={colors.gray500}
          refreshing={fetchStatus === 'refreshing' || shouldRefresh}
          onRefresh={handleRefresh}
        />
      }
      ListEmptyComponent={
        fetchError ? (
          <ErrorTabView error={fetchError} />
        ) : (
          <EmptyTabView message="No one has posted yet" />
        )
      }
      ListFooterComponent={
        postIds.length > 0 && (
          <MasonryListFooter
            loading={!didReachEnd}
            message={!didReachEnd ? 'Loading more posts...' : undefined}
          />
        )
      }
    />
  );
}

// function NearMeTab() {
//   /**
//    * @typedef {import('../settings/settingsSlice').AppSettings} AppSettings
//    * @type {AppSettings}
//    */
//   const { locationQueryPrefs } = useSelector((state) => state.settings);
//
//   /**
//    * NOTE: For now, we'll just fetch merchants
//    * @typedef {import('../../models').Merchant} Merchant
//    * @type {[Merchant[], (value: Merchant) => void]}
//    */
//   const [nearMeItems, setNearMeItems] = useState([]);
//
//   /**
//    * @typedef {{ latitude: number, longitude: number }} CurrentLocation
//    * @type {[CurrentLocation, (value: CurrentLocation) => void]}
//    */
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [isGrantedPermission, setIsGrantedPermission] = useState(false);
//
//   const [shouldFetch, setShouldFetch] = useState(true);
//   const [fetchError, setFetchError] = useState(null);
//
//   /**
//    * @typedef {import('@gorhom/bottom-sheet').BottomSheetModal} BottomSheetModal
//    * @type {React.MutableRefObject<BottomSheetModal | null>} */
//   const bottomSheetModalRef = useRef(null);
//
//   useEffect(() => {
//     const requestAuthorization_iOS = async () => {
//       const result = await GeoLocation.requestAuthorization('whenInUse');
//       console.log('[NearMeTab] iOS location authorization result:', result);
//       setIsGrantedPermission(['granted', 'restricted'].includes(result));
//     };
//
//     const requestAuthorization_Android = async () => {
//       const checkResult = await checkPermission(
//         PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
//       );
//
//       console.log('[NearMeTab] Android check permission:', checkResult);
//       if (['granted', 'limited'].includes(checkResult)) {
//         setIsGrantedPermission(true);
//       }
//
//       const requestResult = await requestPermission(
//         PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION,
//       );
//
//       console.log('[NearMeTab] Android request permission:', requestResult);
//       setIsGrantedPermission(['granted', 'limited'].includes(requestResult));
//     };
//
//     (async () => {
//       if (Platform.OS === 'ios') {
//         await requestAuthorization_iOS();
//       } else if (Platform.OS === 'android') {
//         await requestAuthorization_Android();
//       } else {
//         console.warn('[NearMeTab] Unsupported platform:', Platform.OS);
//         setIsGrantedPermission(false);
//       }
//     })();
//   }, [shouldFetch]);
//
//   useEffect(() => {
//     if (isGrantedPermission) {
//       GeoLocation.getCurrentPosition(
//         (position) => {
//           console.log('Successfully got current position:', position);
//           setCurrentLocation(position.coords);
//         },
//         (error) => {
//           console.error('Failed to get current position:', error);
//           setCurrentLocation(null);
//           setShouldFetch(false);
//           setFetchError(error);
//         },
//         { timeout: 15000, maximumAge: 10000 },
//       );
//     } else {
//       setCurrentLocation(null);
//       console.warn('Not granted permission');
//     }
//   }, [isGrantedPermission]);
//
//   useEffect(() => {
//     const fetchNearMeItems = async () => {
//       try {
//         console.log('[NearMeTab] Fetching near me items...');
//         const items = await MerchantApi.fetchMerchantsNearMe({
//           searchRadius: locationQueryPrefs?.searchRadius,
//           coordinates: currentLocation,
//         });
//         setNearMeItems(items);
//       } catch (error) {
//         console.error('[NearMeTab] Failed to fetch near me items:', error);
//         setFetchError(error);
//       } finally {
//         setShouldFetch(false);
//       }
//     };
//
//     if (isGrantedPermission && currentLocation) {
//       fetchNearMeItems();
//     } else {
//       setShouldFetch(false);
//       setNearMeItems([]);
//     }
//   }, [isGrantedPermission, currentLocation]);
//
//   const handleShowModal = useCallback(() => {
//     bottomSheetModalRef.current?.present();
//   }, []);
//
//   const handleRefresh = () => {
//     if (!shouldFetch) setShouldFetch(true);
//   };
//
//   const handleOpenSettings = async () => {
//     try {
//       await openSettings();
//     } catch (error) {
//       console.error('[NearMeTab] Failed to open settings:', error);
//       Alert.alert(
//         SOMETHING_WENT_WRONG.title,
//         "We weren't able to open the Settings app for you.",
//       );
//     }
//   };
//
//   const tileSpacing = values.spacing.sm * 1.25;
//
//   return (
//     <View style={{ flexGrow: 1 }}>
//       <MasonryList
//         data={nearMeItems}
//         refreshControl={
//           <RefreshControl
//             title="Loading activity near you..."
//             tintColor={colors.gray500}
//             refreshing={shouldFetch}
//             onRefresh={handleRefresh}
//           />
//         }
//         ListEmptyComponent={
//           !isGrantedPermission ? (
//             <>
//               <ErrorTabView
//                 message="We don't know where you are!"
//                 caption="Please allow Discovrr to use your location to view merchants and products near you."
//               />
//               <Button
//                 primary
//                 size="small"
//                 title="Open Settings"
//                 onPress={handleOpenSettings}
//                 style={{
//                   width: 200,
//                   alignSelf: 'center',
//                   marginTop: values.spacing.lg,
//                 }}
//               />
//             </>
//           ) : fetchError ? (
//             <ErrorTabView
//               message="We couldn't get your current location"
//               error={fetchError}
//             />
//           ) : (
//             <View
//               style={{
//                 flexGrow: 1,
//                 justifyContent: 'center',
//               }}>
//               <EmptyTabView message="Looks like there isn't any activity near you" />
//               <Button
//                 primary
//                 size="small"
//                 title="Adjust Search Location"
//                 onPress={handleShowModal}
//                 style={{
//                   width: 200,
//                   alignSelf: 'center',
//                   marginTop: values.spacing.sm,
//                 }}
//               />
//             </View>
//           )
//         }
//         ListFooterComponent={
//           nearMeItems.length > 0 && (
//             <>
//               <MasonryListFooter
//                 message="Not what you're looking for?"
//                 style={{ paddingBottom: 0 }}
//               />
//               <Button
//                 primary
//                 size="small"
//                 title="Adjust Search Location"
//                 onPress={handleShowModal}
//                 style={{
//                   width: 200,
//                   alignSelf: 'center',
//                   marginTop: values.spacing.md,
//                   marginBottom: values.spacing.xl,
//                 }}
//               />
//             </>
//           )
//         }
//         renderItem={({ item: merchant, index }) => (
//           <MerchantItemCard
//             merchant={merchant}
//             key={merchant.id}
//             style={{
//               marginTop: tileSpacing,
//               marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
//               marginRight: index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
//               marginBottom: values.spacing.sm,
//             }}
//           />
//         )}
//       />
//
//       <SearchLocationModal ref={bottomSheetModalRef} />
//     </View>
//   );
// }

// function NearMeTab() {
//   const dispatch = useDispatch();
//
//   /**
//    * @typedef {import('@gorhom/bottom-sheet').BottomSheetModal} BottomSheetModal
//    * @type {React.MutableRefObject<BottomSheetModal | null>}
//    */
//   const bottomSheetModalRef = useRef(null);
//   const tileSpacing = values.spacing.sm * 1.25;
//
//   /** @type {import('../settings/settingsSlice').AppSettings} */
//   const { locationQueryPrefs } = useSelector((state) => state.settings);
//
//   /**
//    * @typedef {{ latitude: number, longitude: number }} Coordinates
//    * @type {[Coordinates[], React.Dispatch<React.SetStateAction<Coordinates[]>>]}
//    */
//   const [currentLocation, setCurrentLocation] = useState(
//     locationQueryPrefs?.coordinates,
//   );
//
//   /**
//    * @typedef {import('../../models').Merchant} NearMeItem
//    * @type {[NearMeItem[], React.Dispatch<React.SetStateAction<NearMeItem[]>>]}
//    */
//   const [nearMeItems, setNearMeItems] = useState([]);
//   const [shouldFetch, setShouldFetch] = useState(true);
//   const [fetchError, setFetchError] = useState(null);
//
//   useEffect(() => {
//     /**
//      * @typedef {import('../../models/common').LocationQueryPreferences} LocationQueryPreferences
//      * @param {LocationQueryPreferences | undefined} query
//      */
//     const fetchNearMeItems = async (query) => {
//       try {
//         console.log('[NearMeTab] Fetching near me items...');
//         const items = await MerchantApi.fetchMerchantsNearMe(query);
//         setNearMeItems(items);
//       } catch (error) {
//         console.error('[NearMeTab] Failed to fetch near me items:', error);
//         setFetchError(error);
//       } finally {
//         setShouldFetch(false);
//       }
//     };
//
//     if (shouldFetch)
//       (async () => {
//         if (locationQueryPrefs) {
//           await fetchNearMeItems(locationQueryPrefs);
//         } else {
//         }
//       })();
//   }, [shouldFetch]);
//
//   const handleRefresh = () => {
//     if (!shouldFetch) setShouldFetch(true);
//   };
//
//   return (
//     <View style={{ flexGrow: 1 }}>
//       <MasonryList
//         data={nearMeItems}
//         refreshControl={
//           <RefreshControl
//             title="Loading activity near you..."
//             tintColor={colors.gray500}
//             refreshing={shouldFetch}
//             onRefresh={handleRefresh}
//           />
//         }
//         renderItem={({ item: merchant, index }) => (
//           <MerchantItemCard
//             merchant={merchant}
//             key={merchant.id}
//             style={{
//               marginTop: tileSpacing,
//               marginLeft: index % 2 === 0 ? tileSpacing : tileSpacing / 2,
//               marginRight: index % 2 !== 0 ? tileSpacing : tileSpacing / 2,
//               marginBottom: values.spacing.sm,
//             }}
//           />
//         )}
//       />
//       <SearchLocationModal ref={bottomSheetModalRef} />
//     </View>
//   );
// }

const selectNearMeItems = createSelector(
  [selectMerchantIds, selectProductIds],
  (allMerchantIds, allProductIds) => {
    // The current product index
    let curr = 0;

    /** @type {import('../../models').NearMeItem[]} */
    const nearMeItems = allMerchantIds.flatMap((merchantId, idx) => {
      // We'll add a product for every four merchant items, if we still have
      // products to choose from
      // NOTE: If `curr >= productIds.length`, no more products will be added,
      // even if there are still more products left in the Redux store
      if (idx % 4 === 0) {
        const productId = allProductIds[curr];
        // We'll skip every 5 products
        curr = (curr + 5) % allProductIds.length;

        return [
          { type: 'merchant', item: merchantId },
          { type: 'product', item: productId },
        ];
      } else {
        return { type: 'merchant', item: merchantId };
      }
    });

    return nearMeItems;
  },
);

function NearMeTab() {
  const dispatch = useDispatch();

  const nearMeItems = useSelector((state) => selectNearMeItems(state));

  const [shouldRefresh, setShouldRefresh] = useState(true);
  const [shouldFetchMore, setShouldFetchMore] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // const [currentPage, setCurrentPage] = useState(0);
  // const [didReachEnd, setDidReachEnd] = useState(false);

  const tileSpacing = useMemo(() => values.spacing.xs * 1.75, []);
  const itemCardStyles = (column) => ({
    marginTop: tileSpacing,
    marginLeft: column % 2 === 0 ? tileSpacing : tileSpacing / 2,
    marginRight: column % 2 !== 0 ? tileSpacing : tileSpacing / 2,
    marginBottom: values.spacing.sm,
  });

  useEffect(() => {
    if (shouldRefresh) {
      (async () => {
        try {
          await Promise.all([
            dispatch(fetchAllMerchants()).unwrap(),
            dispatch(fetchAllProducts()).unwrap(),
          ]);
        } catch (error) {
          console.error('Failed to select merchants and products:', error);
          Alert.alert(SOMETHING_WENT_WRONG.title, SOMETHING_WENT_WRONG.message);
          setFetchError(error);
        } finally {
          setShouldRefresh(false);
        }
      })();
    }
  }, [shouldRefresh]);

  useEffect(() => {
    if (shouldFetchMore) {
      console.warn('UNIMPLEMENTED: Fetch more near me items');
      setShouldFetchMore(false);
    }
  }, [shouldFetchMore]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  // const handleFetchMoreItems = () => {
  //   if (!shouldRefresh && !shouldFetchMore) setShouldFetchMore(true);
  // };

  return (
    <MasonryList
      data={nearMeItems}
      style={{ backgroundColor: colors.white }}
      refreshControl={
        <RefreshControl
          title="Loading activity near you..."
          tintColor={colors.gray500}
          refreshing={shouldRefresh}
          onRefresh={handleRefresh}
        />
      }
      ListEmptyComponent={
        fetchError ? (
          <ErrorTabView
            message="We couldn't get activity near you"
            error={fetchError}
          />
        ) : (
          <EmptyTabView message="There isn't any activity near you" />
        )
      }
      ListFooterComponent={nearMeItems.length > 0 && <MasonryListFooter />}
      renderItem={({ item: nearMeItem, column }) => {
        if (nearMeItem.type === 'merchant') {
          const merchantId = nearMeItem.item;
          return (
            <MerchantItemCard
              merchantId={merchantId}
              style={itemCardStyles(column)}
            />
          );
        } else {
          const productId = nearMeItem.item;
          return (
            <ProductItemCard
              showFooter
              productId={productId}
              promoLabel="buy now!"
              style={[itemCardStyles(column)]}
            />
          );
        }
      }}
    />
  );
}

function FollowingTab() {
  const dispatch = useDispatch();

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

  const [shouldRefresh, setShouldRefresh] = useState(false);

  useEffect(() => {
    if (shouldRefresh)
      (async () => {
        try {
          console.log('[FollowingTab] Refreshing following posts...');
          await Promise.all([
            dispatch(fetchAllPosts()).unwrap(),
            dispatch(fetchAllProfiles()).unwrap(),
          ]);
        } catch (error) {
          console.error(
            '[FollowingTab] Failed to refresh following posts:',
            error,
          );
          Alert.alert(
            'Something went wrong',
            "We couldn't refresh your following posts for you at the moment.",
          );
        } finally {
          setShouldRefresh(false);
        }
      })();
  }, [shouldRefresh]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

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
          refreshing={shouldRefresh}
          onRefresh={handleRefresh}
          colors={[colors.gray500]}
          tintColor={colors.gray500}
        />
      }
      ListEmptyComponent={
        <EmptyTabView
          message="You're not following anyone! Follow someone to see their posts here."
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
