import React, { useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, Text, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';
import MasonryList from 'react-native-masonry-list';

import { connect } from 'react-redux';
import * as actions from './utilities/Actions';

import {
  EmptyTabView,
  ErrorTabView,
  LoadingTabView,
  PostItem,
  PostItemKind,
} from './components';
import { values } from './constants';

const isDevMode = process.env.NODE_ENV === 'development';
const imagePlaceholder = require('../resources/images/imagePlaceholder.png');

const Parse = require('parse/react-native');

const POST_TYPE = {
  DISCOVER: 'posts',
  NEAR_ME: 'nearMePosts',
  FOLLOWING: 'followingPosts',
};

async function fetchData(myUserDetails, selector, pages, dispatch) {
  const { profileId } = myUserDetails;

  let query = null;
  let _pages = pages;

  switch (selector) {
    case POST_TYPE.DISCOVER:
      query = postsQuery(_pages);
      break;
    case POST_TYPE.NEAR_ME:
      break;
    case POST_TYPE.FOLLOWING:
      break;
  }

  const results = await query.find();
  _pages.next += 1;

  if (!(Array.isArray(results) && results.length)) {
    switch (selector) {
      case POST_TYPE.DISCOVER:
        dispatch(actions.updatePosts([]));
        break;
      case POST_TYPE.NEAR_ME:
        dispatch(actions.updateNearMePosts([]));
        break;
      case POST_TYPE.FOLLOWING:
        dispatch(actions.updateFollowingPosts([]));
        break;
    }

    return null;
  }

  _pages.hasMoreData = results.length >= _pages.size;

  const posts = results.map((post) => {
    // const hasProfile = !!post.get('profile');
    let postType = PostItemKind.IMAGE; // default value

    const images = post.get('media');
    if (Array.isArray(images) && images.length) {
      images.forEach(({ type }, i) => {
        if (type === 'video') images[i].isVideo = true;
      });
    }

    const imagePreview =
      (Array.isArray(images) && images.length && images[0]) ?? null;
    const imagePreviewUrl = imagePreview?.url;

    const imagePreviewDimensions = {
      width: imagePreview?.width ?? 800,
      height: imagePreview?.height ?? 600,
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
      images,
      source: imagePreviewSource,
      dimensions: imagePreviewDimensions,
      caption: post.get('caption'),
      location: post.get('location'),
      __refactored: true,
    };
  });

  return { posts, pages: _pages };
}

function postsQuery(pages) {
  const query = new Parse.Query(Parse.Object.extend('Post'));
  query.include('profile');
  query.limit(pages.size);
  query.skip(pages.size * pages.next);

  if (!isDevMode) query.equalTo('status', 0);

  query.greaterThanOrEqualTo('createdAt', new Date('2020-10-30'));
  query.descending('createdAt');

  return query;
}

const DiscoverTab = ({ myUserDetails, dispatch }) => {
  const navigation = useNavigation();

  const [posts, setPosts] = useState([]);
  const [pages, setPages] = useState({ next: 0, hasMoreData: true, size: 40 });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const _fetchData = async () => {
      try {
        const data = await fetchData(
          myUserDetails,
          POST_TYPE.DISCOVER,
          pages,
          dispatch,
        );

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

    _fetchData();
  }, [isRefreshing]); // Will rerun this whenever `isRefreshing` changes

  const addPosts = (_) => {
    console.log('UNIMPLEMENTED: HomeScreen.addPosts');
  };

  const handleRefresh = () => {
    if (!isRefreshing) {
      setIsRefreshing(true);
      setPages({ ...pages, next: 0, hasMoreData: true });
    }
  };

  const handlePressPost = (postData) => {
    navigation.navigate('PostDetailScreen', postData);
  };

  const handlePressAvatar = (postData) => {
    navigation.navigate('UserProfileScreen', {
      userProfile: postData.author,
      metrics: postData.metrics,
    });
  };

  if (isLoading) {
    return <LoadingTabView message="Loading your experience..." />;
  }

  if (error) {
    return <ErrorTabView error={error} />;
  }

  return (
    <MasonryList
      sorted
      rerender
      columns={2}
      images={posts}
      initialNumInColsToRender={1}
      listContainerStyle={{ paddingTop: values.spacing.sm }}
      onEndReachedThreshold={0.1}
      onEndReached={addPosts}
      masonryFlatListColProps={{
        ListEmptyComponent: () => <EmptyTabView style={{ width: '100%' }} />,
        refreshControl: (
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        ),
      }}
      completeCustomComponent={({ data }) => (
        <PostItem
          kind={data.postType}
          text={data.caption}
          author={data.author}
          metrics={data.metrics}
          column={data.column}
          imagePreview={data.source}
          imagePreviewDimensions={data.masonryDimensions}
          onPressPost={() => handlePressPost(data)}
          onPressAvatar={() => handlePressAvatar(data)}
        />
      )}
    />
  );
};

const NearMeTab = ({}) => {
  return (
    <View>
      <Text>NEAR ME</Text>
    </View>
  );
};

const FollowingTab = ({}) => {
  return (
    <View>
      <Text>FOLLOWING</Text>
    </View>
  );
};

const HomeScreen = (props) => {
  const {
    userDetails: myUserDetails,
    route: { params },
  } = props;

  const activeTab = params.postTypes ?? POST_TYPE.DISCOVER;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {(() => {
        switch (activeTab) {
          case POST_TYPE.NEAR_ME:
            return <NearMeTab />;
          case POST_TYPE.FOLLOWING:
            return <FollowingTab />;
          case POST_TYPE.DISCOVER: /* fallthrough */
          default:
            return (
              <DiscoverTab
                myUserDetails={myUserDetails}
                dispatch={props.dispatch}
              />
            );
        }
      })()}
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
