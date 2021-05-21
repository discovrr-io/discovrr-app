import React, { useEffect, useRef, useState } from 'react';
import {
  useWindowDimensions,
  Modal,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import MasonryList from 'react-native-masonry-list';

import { connect, useDispatch } from 'react-redux';
import * as actions from './utilities/Actions';

import {
  Button,
  EmptyTabView,
  ErrorTabView,
  LoadingTabView,
  PostItem,
  PostItemKind,
} from './components';
import { colors, typography, values } from './constants';

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
    case POST_TYPE.NEAR_ME:
      query = nearMePostsQuery(undefined);
      break;
    case POST_TYPE.FOLLOWING:
      query = followingPostsQuery(followingArray, blockedProfiles);
      break;
    default:
      console.warn(
        `Unrecognised selector '${selector}'.`,
        `Defaulting to 'posts'...`,
      );
      query = postQuery(blockedProfiles, _pages);
      break;
  }

  const results = await query.find();
  _pages.next += 1;

  if (selector === POST_TYPE.DISCOVER || selector === POST_TYPE.FOLLOWING) {
    const Profile = Parse.Object.extend('Profile');
    const profilePointer = new Profile();
    profilePointer.id = profileId;

    const notesQuery = new Parse.Query(Parse.Object.extend('Board'));
    notesQuery.equalTo('profile', profilePointer);
    notesQuery.equalTo('status', 0);
    notesQuery.select('title', 'image', 'pinnedEnjagaArray');

    const pinnedPosts = {};

    const notesResult = await notesQuery.find();
    if (Array.isArray(notesResult) && notesResult.length) {
      for (const note of notesResult) {
        const pinnedEnjagaArray = note.get('pinnedEnjagaArray');
        if (Array.isArray(pinnedEnjagaArray) && pinnedEnjagaArray.length) {
          for (const postId of pinnedEnjagaArray) {
            pinnedPosts[postId] = note.id;
          }
        }
      }
    }

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
          ownerId: post.get('profile')?.get('owner')?.id,
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
          hasSaved: !!pinnedPosts[post.id],
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

  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState({ next: 0, hasMoreData: true, size: 40 });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isModalVisible, setIsModalVisible] = useState(true);
  const { width: screenWidth } = useWindowDimensions();

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
        console.log({ code: error.code });
        setPosts([]);
        setError(error);
        console.error(`Failed to fetch posts for tab '${activeTab}': ${error}`);
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

  const handlePressSave = async (postData, hasSaved) => {
    console.warn(`Unimplemented: HomeScreen.handlePressSave(..., ${hasSaved})`);
  };

  if (activeTab === POST_TYPE.NEAR_ME) {
    return (
      <>
        <EmptyTabView title="🚧" message="Under Construction" />
        <Text style={{ textAlign: 'center' }}>
          We're working on this page at the moment.
        </Text>
      </>
    );
  }

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
    <>
      <Modal
        transparent
        animationType="slide"
        visible={isModalVisible && activeTab === POST_TYPE.DISCOVER}
        onRequestClose={() => setIsModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
          <SafeAreaView
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <View
              style={[
                modalStyles.container,
                { width: Math.min(screenWidth * 0.85, 360) },
              ]}>
              <View style={modalStyles.textContainer}>
                <Text style={modalStyles.title}>Hi there 👋</Text>
                <Text style={modalStyles.message}>
                  Cheers for downloading our app!
                </Text>
                <Text style={modalStyles.message}>
                  We're currently in beta – that means you're one of the first
                  to use Discovrr! Please excuse any bugs or hiccups you may
                  encounter. However, make as many posts or comments as you
                  like! 😀
                </Text>
                <Text style={modalStyles.message}>
                  The Discovrr team is here if you have any feedback to provide.
                  Get in contact us with at discovrrapp@gmail.com. We value all
                  feedback you can share!
                </Text>
              </View>
              <Button
                primary
                title="Lemme Try"
                style={modalStyles.button}
                onPress={() => setIsModalVisible(false)}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>
      <MasonryList
        sorted
        rerender
        columns={activeTab === POST_TYPE.FOLLOWING ? 1 : 2}
        images={posts}
        listContainerStyle={{ paddingTop: values.spacing.sm }}
        onEndReachedThreshold={0.1}
        onEndReached={addPosts}
        masonryFlatListColProps={{
          ListEmptyComponent: () => <EmptyTabView style={{ width: '100%' }} />,
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
            onPressSave={(hasSaved) => handlePressSave(data, hasSaved)}
            style={{
              marginHorizontal:
                values.spacing.xs *
                (activeTab === POST_TYPE.FOLLOWING ? 1 : 1.1),
            }}
          />
        )}
      />
    </>
  );
};

const modalStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: values.radius.lg,
    padding: values.spacing.lg + values.spacing.sm,
  },
  textContainer: {
    paddingHorizontal: values.spacing.sm,
    marginBottom: values.spacing.lg,
  },
  title: {
    fontSize: typography.size.h2,
    fontWeight: '700',
    marginBottom: values.spacing.md,
  },
  message: {
    fontSize: typography.size.md,
    marginBottom: values.spacing.md,
  },
  button: {},
});

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
