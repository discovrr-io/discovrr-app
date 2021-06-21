import React, { useEffect, useRef, useState } from 'react';
import {
  useWindowDimensions,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';

import MasonryList from 'react-native-masonry-list';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { unwrapResult } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

import MerchantItem from '../merchant/MerchantItem';
import { PostItem, EmptyTabView, ErrorTabView } from '../../components';
import { colors, typography, values } from '../../constants';

import { fetchProfiles } from '../profile/profilesSlice';
import {
  fetchAllPosts,
  fetchFollowingPosts,
  selectAllPosts,
} from './postsSlice';

const PAGINATION_LIMIT = 26;
const DEFAULT_SEARCH_RADIUS = 3;

const Parse = require('parse/react-native');
const imagePlaceholder = require('../../../resources/images/imagePlaceholder.png');

const FeedTab = createMaterialTopTabNavigator();

/** @type {import('react-native').ViewStyle} */
const tabViewStyles = {
  flexGrow: 1,
  backgroundColor: colors.white,
};

function DiscoverTab() {
  const dispatch = useDispatch();
  // const isInitialRender = useRef(true);
  const { width: screenWidth } = useWindowDimensions();

  const posts = useSelector(selectAllPosts);

  /** @type {import('./postsSlice').FetchStatus} */
  const { error: fetchError } = useSelector((state) => state.posts);

  const [currentPage, setCurrentPage] = useState(0);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(true);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  const handleFetchMorePosts = () => {
    if (!shouldRefresh) setCurrentPage((prev) => prev + 1);
  };

  useEffect(() => {
    const refreshPosts = async () => {
      try {
        console.log('Refreshing posts and profiles...');
        await dispatch(fetchAllPosts());
        await dispatch(fetchProfiles());
      } catch (error) {
        console.error('[HomeScreen] Failed to refresh posts:', error);
        Alert.alert(
          'Something wrong happened',
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
      try {
        setIsFetchingMore(true);
        /** @type {import('../../models').Post[]} */
        const posts = await dispatch(
          fetchAllPosts({ limit: PAGINATION_LIMIT, currentPage }),
        ).then(unwrapResult);

        if (posts.length === 0) {
          Alert.alert(
            "You're all caught up!",
            "Looks like you've reached the end",
          );
        } else {
          await dispatch(fetchProfiles());
          setCurrentPage((prev) => prev + 1);
        }
      } catch (error) {
        console.error('[HomeScreen] Failed to fetch more posts:', error);
        Alert.alert(
          'Something wrong happened',
          "We couldn't fetch more posts for you",
        );
      } finally {
        setIsFetchingMore(false);
      }
    };

    if (!shouldRefresh && !isFetchingMore) fetchMorePosts();
  }, [currentPage, dispatch]);

  const masonryPosts = posts.map((post) => {
    /** @type {import('../../models/common').ImageSource} */
    let imagePreviewSource;
    /** @type {{ width: number, height: number }} */
    let imagePreviewDimensions;

    if (!post.media) {
      imagePreviewSource = imagePlaceholder;
    } else if (Array.isArray(post.media)) {
      const firstImage = post.media[0];
      imagePreviewSource = firstImage ?? imagePlaceholder;
      imagePreviewDimensions = {
        width: firstImage?.width ?? 800,
        height: firstImage?.height ?? 600,
      };
    } else {
      imagePreviewSource = post.media;
      imagePreviewDimensions = {
        width: post.media.width ?? 800,
        height: post.media.height ?? 600,
      };
    }

    return {
      id: post.id,
      type: post.type,
      source: imagePreviewSource,
      dimensions: imagePreviewDimensions,
    };
  });

  return (
    <MasonryList
      sorted
      rerender
      columns={2}
      images={masonryPosts}
      containerWidth={screenWidth}
      listContainerStyle={{ ...tabViewStyles, paddingTop: values.spacing.sm }}
      onEndReachedThreshold={0.5}
      onEndReached={handleFetchMorePosts}
      masonryFlatListColProps={{
        ListEmptyComponent: fetchError ? (
          <ErrorTabView error={fetchError} style={tabViewStyles} />
        ) : (
          <EmptyTabView style={tabViewStyles} />
        ),
        // ListFooterComponent: (
        //   <View style={{ paddingVertical: values.spacing.xxl }}>
        //     <Text
        //       style={{
        //         textAlign: 'center',
        //         fontSize: typography.size.lg,
        //         fontWeight: '700',
        //       }}>
        //       You're all caught up!
        //     </Text>
        //   </View>
        // ),
        refreshControl: (
          <RefreshControl
            refreshing={shouldRefresh}
            onRefresh={handleRefresh}
            colors={[colors.gray500]}
            tintColor={colors.gray500}
            title="Loading your personalised feed..."
          />
        ),
      }}
      completeCustomComponent={({ data }) => (
        <PostItem
          postId={data.id}
          column={data.column}
          imagePreview={data.source}
          imagePreviewDimensions={data.masonryDimensions}
          footerOptions={{ showActions: true }}
        />
      )}
    />
  );
}

function NearMeTab() {
  const { width: screenWidth } = useWindowDimensions();

  const [nearMeItems, setNearMeItems] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [error, setError] = useState(null);

  const handleRefresh = () => {
    if (!isRefreshing) setIsRefreshing(true);
  };

  /** @type {import('../authentication/authSlice').AuthState} */
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  if (!isAuthenticated || !user) {
    console.error('[NearMeTab] User is not authenticated:', user);
    return null;
  }

  useEffect(() => {
    const fetchNearMeItems = async () => {
      try {
        console.log('[NearMeTab] Fetching near me items...');
        const query = new Parse.Query(Parse.Object.extend('Vendor'));
        // query.equalTo('editedDelete', true);

        console.log('user location settings:', user.settings);

        let pointOfInterest;
        const geoPointKey = 'geopoint';

        if (user.settings) {
          const { searchRadius, currentLocation } =
            user.settings.locationPreference;
          const { latitude, longitude } = currentLocation;
          pointOfInterest = new Parse.GeoPoint(latitude, longitude);
          query.withinKilometers(geoPointKey, pointOfInterest, searchRadius);
        } else {
          pointOfInterest = new Parse.GeoPoint(
            -33.92313968574856,
            151.0861961540703,
          );
          query.withinKilometers(
            geoPointKey,
            pointOfInterest,
            DEFAULT_SEARCH_RADIUS,
          );
        }

        const results = await query.findAll();
        const nearMeItems = results.map((item) => {
          const imagePreviewArray = item.get('media');
          const imagePreview = imagePreviewArray
            ? { uri: imagePreviewArray[0].url }
            : imagePlaceholder;

          let imagePreviewDimensions;
          if (typeof imagePreview === 'number') {
            imagePreviewDimensions = { width: 600, height: 400 };
          } else {
            imagePreviewDimensions = {
              width: imagePreview.width,
              height: imagePreview.height,
            };
          }

          return {
            id: item.id,
            shortName: item.get('shortName'),
            profileId: item.get('profile'),
            source: imagePreview,
            dimensions: imagePreviewDimensions,
          };
        });
        setNearMeItems(nearMeItems);
      } catch (error) {
        console.error('[NearMeTab] Failed to fetch near me items:', error);
        setError(error);
      } finally {
        setIsRefreshing(false);
      }
    };

    if (isRefreshing) fetchNearMeItems();
  }, [isRefreshing]);

  return (
    <MasonryList
      sorted
      rerender
      columns={2}
      images={nearMeItems}
      containerWidth={screenWidth}
      listContainerStyle={{ ...tabViewStyles, paddingTop: values.spacing.sm }}
      masonryFlatListColProps={{
        ListEmptyComponent: error ? (
          <ErrorTabView error={error} style={tabViewStyles} />
        ) : (
          <EmptyTabView style={tabViewStyles} />
        ),
        refreshControl: (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.gray500]}
            tintColor={colors.gray500}
            title="Getting posts and products near you..."
          />
        ),
      }}
      completeCustomComponent={({ data }) => (
        <MerchantItem
          merchantId={data.id}
          shortName={data.shortName}
          coverPhoto={data.source}
          coverPhotoDimensions={data.masonryDimensions}
          style={{ marginLeft: values.spacing.sm * 0.75 }}
        />
      )}
    />
  );
}

function FollowingTab() {
  const dispatch = useDispatch();
  const { width: screenWidth } = useWindowDimensions();

  const [followingPosts, setFollowingPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(true);

  const handleRefresh = () => {
    if (!isRefreshing) setIsRefreshing(true);
  };

  useEffect(() => {
    const fetchData = async () => {
      const pagination = {
        limit: PAGINATION_LIMIT,
      };

      dispatch(fetchFollowingPosts({ pagination }))
        .then(unwrapResult)
        .then((followingPosts) => {
          setFollowingPosts(followingPosts);
          setIsRefreshing(false);
        })
        .catch((error) => {
          console.error(error);
          setIsRefreshing(false);
        });
    };

    if (isRefreshing) fetchData();
  }, [isRefreshing, dispatch]);

  return (
    <FlatList
      data={followingPosts}
      style={{ backgroundColor: colors.white }}
      contentContainerStyle={{ ...tabViewStyles, padding: values.spacing.md }}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.gray500]}
          tintColor={colors.gray500}
          title="Getting posts from people you follow..."
        />
      }
      ListEmptyComponent={<EmptyTabView style={tabViewStyles} />}
      renderItem={({ item: post }) => {
        /** @type {import('../../models/common').ImageSource} */
        const imagePreview = post.media[0] ?? imagePlaceholder;

        /** @type {{ width: number, height: number }} */
        let imagePreviewDimensions;

        if (typeof imagePreview === 'number') {
          imagePreviewDimensions = { width: 600, height: 400 };
        } else {
          imagePreviewDimensions = {
            width: imagePreview.width,
            height: imagePreview.height,
          };
        }

        const screenHorizontalMargin = values.spacing.md;
        const { width: imageWidth, height: imageHeight } =
          imagePreviewDimensions;

        // Maybe consider refactoring to prevent this being recomputed
        const newImageWidth = screenWidth - screenHorizontalMargin * 2;
        const aspectRatio = newImageWidth / imageWidth;
        const newImageHeight = imageHeight * aspectRatio;

        return (
          <PostItem
            postId={post.id}
            imagePreview={post.media[0]}
            imagePreviewDimensions={{
              width: newImageWidth,
              height: newImageHeight,
            }}
            footerOptions={{ largeIcons: true, showActions: true }}
          />
        );
      }}
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
