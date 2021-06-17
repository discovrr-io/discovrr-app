import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, RefreshControl, Text, View } from 'react-native';

import MasonryList from 'react-native-masonry-list';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { useDispatch, useSelector } from 'react-redux';

import { PostItem } from '../../components';
import { colors, values } from '../../constants';
import { fetchPosts, selectAllPosts } from './postsSlice';
import { fetchProfiles, selectAllProfiles } from '../profile/profilesSlice';

const imagePlaceholder = require('../../../resources/images/imagePlaceholder.png');

const FeedTab = createMaterialTopTabNavigator();

function DiscoverTab() {
  const dispatch = useDispatch();
  const posts = useSelector(selectAllPosts);

  /** @type {import('../../constants/api').FetchStatus} */
  const { status: fetchStatus, error: fetchError } = useSelector(
    (state) => state.posts,
  );

  const isInitialRender = useRef(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsProcessing(true);
      await dispatch(fetchPosts(isInitialRender.current || shouldRefresh));
      // await dispatch(fetchProfiles());
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
  }, [fetchStatus, shouldRefresh, dispatch]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  // const handlePressPost = (postData) => {
  //   navigation.push('PostDetailScreen', postData);
  // };

  if (posts.length === 0 && fetchStatus === 'pending') {
    return (
      <View
        style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.gray} />
        <Text style={[font.small, { marginTop: values.spacing.md }]}>
          Loading your personalised feed...
        </Text>
      </View>
    );
  } else if (fetchStatus === 'rejected') {
    return (
      <View
        style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[{ color: 'red' }]}>
          Failed to fetch posts: {JSON.stringify(fetchError)}
        </Text>
      </View>
    );
  }

  return (
    <MasonryList
      sorted
      rerender
      columns={2}
      images={posts.map((post) => {
        let imagePreviewSource, imagePreviewDimensions;
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
      })}
      listContainerStyle={{ paddingTop: values.spacing.sm }}
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
