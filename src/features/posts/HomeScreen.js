import React, { useEffect, useRef, useState } from 'react';
import {
  useWindowDimensions,
  Alert,
  FlatList,
  RefreshControl,
  Text,
  View,
} from 'react-native';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { unwrapResult } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';

import PostItemCard from './PostItemCard';
import MerchantItem from '../merchants/MerchantItem';
import { MasonryList, EmptyTabView, ErrorTabView } from '../../components';
import { colors, values } from '../../constants';

import { fetchAllProfiles } from '../profiles/profilesSlice';
import {
  fetchAllPosts,
  // fetchFollowingPosts,
  selectFollowingPosts,
  selectPostIds,
} from './postsSlice';
import PostMasonryList from '../../components/masonry/PostMasonryList';

const PAGINATION_LIMIT = 26;
const DEFAULT_SEARCH_RADIUS = 3;

const Parse = require('parse/react-native');
const imagePlaceholder = require('../../../resources/images/imagePlaceholder.png');

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
        <EmptyTabView message="Looks like no one has posted anything yet" />
      }
      refreshControl={
        <RefreshControl
          tintColor={colors.gray500}
          refreshing={shouldRefresh}
          onRefresh={handleRefresh}
        />
      }
    />
  );
}

function NearMeTab() {
  return <EmptyTabView />;
}

function FollowingTab() {
  const dispatch = useDispatch();
  const { width: screenWidth } = useWindowDimensions();

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
  console.log({ followingPostsIds });

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
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          colors={[colors.gray500]}
          tintColor={colors.gray500}
          title="Getting posts from people you follow..."
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
