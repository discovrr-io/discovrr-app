import React, { useEffect, useState } from 'react';
import {
  useWindowDimensions,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Text,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import MasonryList from 'react-native-masonry-list';

import { connect, useDispatch } from 'react-redux';
import * as actions from './utilities/Actions';

import {
  EmptyTabView,
  ErrorTabView,
  LoadingTabView,
  PostItem,
  PostItemKind,
} from './components';
import { colors, values } from './constants';

const isDevMode = process.env.NODE_ENV === 'development';
const imagePlaceholder = require('../resources/images/imagePlaceholder.png');

const Parse = require('parse/react-native');

const POST_TYPE = {
  DISCOVER: 'posts',
  NEAR_ME: 'nearMePosts',
  FOLLOWING: 'followingPosts',
};

const DEFAULT_DATE = new Date('2020-10-30');

function postQuery(blockedProfiles, pages) {
  const query = new Parse.Query(Parse.Object.extend('Post'));
  query.include('profile');
  query.limit(pages.size);
  query.skip(pages.size * pages.next);
  query.greaterThanOrEqualTo('createdAt', DEFAULT_DATE);
  query.descending('createdAt');

  if (!isDevMode) query.equalTo('status', 0);

  if (Array.isArray(blockedProfiles) && blockedProfiles.length) {
    query.notContainedIn('profile', blockedProfiles);
  }

  return query;
}

function nearMePostsQuery(locationPreference) {
  const query = new Parse.Query(Parse.Object.extend('Vendor'));
  query.equalTo('editedDelete', true);

  let pointOfInterest;
  if (locationPreference) {
    pointOfInterest = new Parse.GeoPoint(
      locationPreference.latitude,
      locationPreference.longitude,
    );
    query.withinKilometers(
      'geopoint',
      pointOfInterest,
      locationPreference.searchRadius,
    );
  } else {
    pointOfInterest = new Parse.GeoPoint(-33.88013879489698, 151.1145074106);
    query.withinKilometers('geopoint', pointOfInterest, 5);
  }

  return query;
}

function followingPostsQuery(followingArray, blockedProfiles) {
  const query = new Parse.Query(Parse.Object.extend('Post'));
  query.containedIn('profile', followingArray);
  query.greaterThanOrEqualTo('createdAt', DEFAULT_DATE);
  query.descending('createdAt');

  if (!isDevMode) query.equalTo('status', 0);

  if (Array.isArray(blockedProfiles) && blockedProfiles.length) {
    query.notContainedIn('profile', blockedProfiles);
  }

  return query;
}

async function fetchData(selector, myUserDetails, pages, dispatch) {
  let _pages = pages;
  const {
    profileId,
    followingArray = [],
    blockedProfiles = [],
  } = myUserDetails;

  let query = undefined;
  switch (selector) {
    case POST_TYPE.DISCOVER:
      query = postQuery(blockedProfiles, _pages);
      break;
    case POST_TYPE.FOLLOWING:
      query = followingPostsQuery(followingArray, blockedProfiles);
      break;
    case POST_TYPE.FOLLOWING:
      query = postQuery(blockedProfiles);
      break;
    case POST_TYPE.NEAR_ME:
      query = nearMePostsQuery(undefined);
      break;
    default:
      console.warn(
        `Unrecognised selector '${selector}'.`,
        `Defaulting to 'posts'...`,
      );
      query = postQuery(blockedProfiles);
      break;
  }

  const results = await query.find();
  _pages.next += 1;

  if (selector === POST_TYPE.DISCOVER || selector === POST_TYPE.FOLLOWING) {
    // TODO: pinnedEnjagaArray (???)

    if (!(Array.isArray(results) && results.length)) {
      if (selector === POST_TYPE.DISCOVER) {
        dispatch(actions.updatePosts([]));
      } else {
        dispatch(actions.updateFollowingPosts([]));
      }

      return { posts: [], pages: _pages };
    }

    _pages.hasMoreData = results.length >= _pages.size;

    const posts = results.map((post) => {
      let postType = PostItemKind.MEDIA; // default value

      const media = post.get('media');
      if (Array.isArray(media) && media.length) {
        media.forEach(({ type }, i) => {
          if (type === 'video') media[i].isVideo = true;
        });
      }

      const postPreview =
        (Array.isArray(media) && media.length && media[0]) ?? null;
      const imagePreviewUrl = postPreview?.url;

      const imagePreviewDimensions = {
        width: postPreview?.width ?? 800,
        height: postPreview?.height ?? 600,
      };

      if (!imagePreviewUrl) postType = PostItemKind.TEXT;

      // We use a placeholder for now if it is a text post
      const imagePreviewSource = imagePreviewUrl
        ? { uri: imagePreviewUrl }
        : imagePlaceholder;

      let likesCount = 0;
      let hasLiked = false;
      const likersArray = post.get('likersArray');
      if (Array.isArray(likersArray) && likersArray.length) {
        likesCount = likersArray.length;
        hasLiked = likersArray.some((liker) => profileId === liker);
      }

      return {
        author: {
          id: post.get('profile')?.id,
          name: post.get('profile')?.get('name') ?? 'Anonymous',
          avatar: post.get('profile')?.get('avatar'),
          description: post.get('profile')?.get('description'),
          followersCount: post.get('profile')?.get('followersCount'),
          followingCount: post.get('profile')?.get('followingCount'),
          coverPhoto: post.get('profile')?.get('coverPhoto'),
        },
        metrics: {
          likesCount,
          hasLiked,
          hasSaved: false, // TODO
        },
        id: post.id,
        key: `${imagePreviewUrl ?? imagePlaceholder}`,
        postType,
        media,
        source: imagePreviewSource,
        dimensions: imagePreviewDimensions,
        caption: post.get('caption'),
        viewersCount: post.get('viewersCount'),
        location: post.get('location'),
        __refactored: true,
      };
    });

    if (selector === POST_TYPE.DISCOVER) {
      dispatch(actions.updatePosts(posts));
    } else {
      dispatch(actions.updateFollowingPosts(posts));
    }

    return { posts, pages: _pages };
  } else {
    /* TODO: NEAR ME */
    console.warn('Unimplemented: Near Me tab');
    return null;
  }
}

const HomeScreen = (props) => {
  const {
    userDetails: myUserDetails,
    route: { params },
  } = props;

  const activeTab = params.postTypes ?? POST_TYPE.DISCOVER;
  const navigation = useNavigation();
  const dispatch = useDispatch();

  const { width: screenWidth } = useWindowDimensions();

  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState({ next: 0, hasMoreData: true, size: 40 });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const _fetchData = async () => {
      try {
        const data = await fetchData(activeTab, myUserDetails, pages, dispatch);
        if (data) {
          const { posts, pages: newPages } = data;
          setPosts(posts);
          setPages(newPages);
        } else {
          setPosts([]);
        }
      } catch (error) {
        setPosts([]);
        setError(error);
        console.error(`Failed to fetch posts: ${error}`);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    };

    if (isLoading || isRefreshing) _fetchData();

    // TODO: syncOneSignal
  }, [isRefreshing]); // This will run whenever `isRefreshing` changes

  const addPosts = (_) => {
    console.warn('UNIMPLEMENTED: HomeScreen.addPosts');
  };

  const handleRefresh = () => {
    if (!isRefreshing) {
      setIsRefreshing(true);
      setPages({ ...pages, next: 0, hasMoreData: true });
    }
  };

  const handlePressPost = (postData) => {
    navigation.push('PostDetailScreen', postData);
  };

  const handlePressAvatar = (postData) => {
    navigation.push('UserProfileScreen', {
      userProfile: postData.author,
      metrics: postData.metrics,
    });
  };

  if (isLoading) {
    return (
      <LoadingTabView
        message={
          activeTab === POST_TYPE.DISCOVER
            ? 'Loading your experience...'
            : 'Loading posts...'
        }
        style={{ flex: 1, backgroundColor: colors.white }}
      />
    );
  }

  if (error) {
    return (
      <ErrorTabView
        error={error}
        style={{ flex: 1, backgroundColor: colors.white }}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {activeTab === POST_TYPE.FOLLOWING ? (
        <FlatList
          data={posts}
          keyExtractor={(item, _) => item.id}
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: values.spacing.sm,
            paddingTop: values.spacing.sm,
          }}
          ListEmptyComponent={() => <EmptyTabView style={{ width: '100%' }} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={[colors.gray500]}
              tintColor={colors.gray500}
            />
          }
          renderItem={({ item }) => {
            const { height } = item.dimensions;
            const imageWidth = screenWidth - values.spacing.md;
            const imageHeight = height * (imageWidth / height);

            const imageDimensions = {
              width: imageWidth,
              height: imageHeight,
            };

            return (
              <PostItem
                id={item.id}
                kind={item.postType}
                text={item.caption}
                author={item.author}
                metrics={item.metrics}
                column={item.column}
                imagePreview={item.source}
                imagePreviewDimensions={imageDimensions}
                onPressPost={() => handlePressPost(item)}
                onPressAvatar={() => handlePressAvatar(item)}
              />
            );
          }}
        />
      ) : (
        <MasonryList
          sorted
          rerender
          columns={2}
          images={posts}
          initialNumInColsToRender={activeTab === POST_TYPE.NEAR_ME ? 0 : 1}
          listContainerStyle={{ paddingTop: values.spacing.sm }}
          onEndReachedThreshold={0.1}
          onEndReached={addPosts}
          masonryFlatListColProps={{
            ListEmptyComponent: () => (
              <EmptyTabView style={{ width: '100%' }} />
            ),
            refreshControl: (
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.gray500]}
                tintColor={colors.gray500}
              />
            ),
          }}
          completeCustomComponent={({ data }) => (
            <PostItem
              id={data.id}
              kind={data.postType}
              text={data.caption}
              author={data.author}
              metrics={data.metrics}
              column={data.column}
              imagePreview={data.source}
              imagePreviewDimensions={data.masonryDimensions}
              onPressPost={() => handlePressPost(data)}
              onPressAvatar={() => handlePressAvatar(data)}
              style={{ marginLeft: values.spacing.xs * 1.5 }}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const mapStateToProps = (state, props) => {
  const { postTypes } = props;
  const {
    cachedState,
    userState: { locationPreference, userDetails },
  } = state;

  return {
    userDetails,
    locationPreference,
    items: cachedState[postTypes] ?? [],
  };
};

export default connect(mapStateToProps)(HomeScreen);
