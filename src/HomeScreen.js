import React, { useEffect, useState } from 'react';
import { SafeAreaView, Text, View } from 'react-native';

import MasonryList from 'react-native-masonry-list';

import { connect } from 'react-redux';

import {
  EmptyTabView,
  LoadingTabView,
  PostItem,
  PostItemKind,
} from './components';
import { colors, typography, values } from './constants';

const POST_TYPE = {
  DISCOVER: 'posts',
  NEAR_ME: 'nearMePosts',
  FOLLOWING: 'followingPosts',
};

async function fetchData(postType, origin = null) {
  return [];
}

const DiscoverTab = ({}) => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const posts = await fetchData(POST_TYPE.DISCOVER);
        setPosts(posts);
        setIsLoading(false);
      } catch (error) {
        setPosts([]);
        setIsLoading(false);
        setError(error);
      }
    };

    fetchData();
  }, [setPosts]);

  if (isLoading) {
    return (
      <LoadingTabView message="Fetching a curated experience for you..." />
    );
  }

  return (
    <MasonryList
      columns={2}
      initialNumInColsToRender={1}
      images={posts}
      emptyView={() => <EmptyTabView message="It's quiet here" />}
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

const HomeScreen = ({ route }) => {
  const activeTab = route.params.postTypes ?? POST_TYPE.DISCOVER;

  const [isFetchingData, setIsFetchingData] = useState(true);
  const [isRefreshingData, setIsRefreshingData] = useState(false);

  return (
    <SafeAreaView>
      {(() => {
        switch (activeTab) {
          case POST_TYPE.DISCOVER:
            return <DiscoverTab />;
          case POST_TYPE.NEAR_ME:
            return <NearMeTab />;
          case POST_TYPE.FOLLOWING:
            return <FollowingTab />;
          default:
            return <DiscoverTab />;
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
