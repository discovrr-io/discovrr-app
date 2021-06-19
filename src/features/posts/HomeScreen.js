import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';

import MasonryList from 'react-native-masonry-list';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useDispatch, useSelector } from 'react-redux';

import { PostItem, ErrorTabView } from '../../components';
import { colors, values } from '../../constants';

import { fetchProfiles } from '../profile/profilesSlice';
import { fetchAllPosts, selectAllPosts } from './postsSlice';

const PAGINATION_LIMIT = 10;
const imagePlaceholder = require('../../../resources/images/imagePlaceholder.png');

const FeedTab = createMaterialTopTabNavigator();

function DiscoverTab() {
  const dispatch = useDispatch();
  const posts = useSelector(selectAllPosts);

  /** @type {import('../../models/fetch').FetchLoadingStatus} */
  const fetchStatus = useSelector((state) => state.posts.status);

  /** @type {import('@reduxjs/toolkit').SerializedError | undefined} */
  const fetchError = useSelector((state) => state.posts.error);

  const isInitialRender = useRef(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const currentPage = useRef(0);

  useEffect(() => {
    const fetchData = async () => {
      setIsProcessing(true);
      await dispatch(
        fetchAllPosts({
          limit: PAGINATION_LIMIT,
          currentPage: currentPage.current,
        }),
      );
      await dispatch(fetchProfiles());
      setIsProcessing(false);
      if (shouldRefresh) setShouldRefresh(false);
    };

    if (
      !isProcessing &&
      (isInitialRender.current || fetchStatus === 'idle' || shouldRefresh)
    ) {
      fetchData();
    }

    if (isInitialRender.current) isInitialRender.current = false;
  }, [/* fetchStatus, */ shouldRefresh, dispatch]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  if (posts.length === 0 && fetchStatus === 'pending') {
    return (
      <View
        style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.gray} />
        <Text style={[/* font.small, */ { marginTop: values.spacing.md }]}>
          Loading your personalised feed...
        </Text>
      </View>
    );
  } else if (fetchStatus === 'rejected') {
    return (
      <ErrorTabView
        refreshControl={
          <RefreshControl
            refreshing={shouldRefresh}
            onRefresh={handleRefresh}
            colors={[colors.gray500]}
            tintColor={colors.gray500}
          />
        }
        error={fetchError}
      />
    );
  }

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
      listContainerStyle={{ paddingTop: values.spacing.sm }}
      onEndReachedThreshold={0.0}
      masonryFlatListColProps={{
        refreshControl: (
          <RefreshControl
            refreshing={shouldRefresh}
            onRefresh={handleRefresh}
            colors={[colors.gray500]}
            tintColor={colors.gray500}
          />
        ),
      }}
      completeCustomComponent={({ data }) => (
        <PostItem
          postId={data.id}
          type={data.type}
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
  return (
    <View>
      <Text>Near Me Tab</Text>
    </View>
  );
}

function FollowingTab() {
  return (
    <View>
      <Text>Following Tab</Text>
    </View>
  );
}

export default function HomeScreen() {
  return (
    <FeedTab.Navigator
      tabBarOptions={{ labelStyle: { textTransform: 'none' } }}>
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
