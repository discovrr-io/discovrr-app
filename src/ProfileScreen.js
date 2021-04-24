import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { connect } from 'react-redux';

import { colors, typography, values } from './constants';
import { Button, ToggleButton } from './components';

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const Parse = require('parse/react-native');

async function fetchData(selector, setter, routeParams, userDetails) {
  try {
    const currentUser = await Parse.User.currentAsync();
    if (!currentUser) return;

    switch (selector) {
      case 'posts':
        fetchPosts(setter, routeParams, userDetails);
        break;

      default:
        console.log(`Unhandled selector: ${selector}`);
        break;
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
}

async function fetchPosts(setter, routeParams, userDetails) {
  const { isUserProfile, userProfile } = routeParams;
  const profileId = isUserProfile
    ? userProfile.profileId
    : userDetails.profileId;

  const profilePointer = {
    __type: 'Pointer',
    className: 'Profile',
    objectId: profileId,
  };

  const query = new Parse.Query(Parse.Object.extend('Post'));
  query.include('profile');
  query.equalTo('profile', profilePointer);

  // !isDevMode && query.equalTo('status', 0);
  query.greaterThanOrEqualTo('createdAt', new Date('2020-10-30'));
  query.descending('createdAt');

  const results = await query.find();
  if (Array.isArray(results) && results.length) {
    const items = results.map((item) => {
      const images = item.get('media');
      const imagePreview = (Array.isArray(images) && images[0]) || null;
      const imagePreviewUrl = imagePreview?.url ?? null;
      const imagePreviewSource = imagePreviewUrl
        ? { uri: imagePreviewUrl }
        : imagePlaceholder;

      return {
        images,
        imagePreviewSource,
      };
    });

    setter(items ?? []);
  } else {
    // TODO...
  }
}

const Tab = createMaterialTopTabNavigator();

const ProfileScreenHeader = ({ userProfile }) => {
  if (!userProfile) {
    return <Text>NO USER PROFILE</Text>;
  }

  const {
    avatar: { url: avatarUrl } = {},
    coverPhoto: { url: coverPhotoUrl } = {},
    followersCount,
    followingCount,
  } = userProfile;
  const headerImage = coverPhotoUrl ? { uri: coverPhotoUrl } : imagePlaceholder;
  const avatarImage = avatarUrl ? { uri: avatarUrl } : defaultAvatar;

  const Metric = ({ title, value, ...props }) => (
    <View {...(props.style || {})} style={metricStyles.container}>
      <Text style={metricStyles.title}>{title}</Text>
      <Text style={metricStyles.value}>
        {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
    </View>
  );

  return (
    <View>
      <Image style={headerStyles.headerBackground} source={headerImage} />
      <View style={headerStyles.profileDetails}>
        <View style={headerStyles.profileMetrics}>
          <Image style={headerStyles.profileAvatar} source={avatarImage} />
          <View style={headerStyles.profileMetricsInner}>
            <View style={headerStyles.profileMetricsDetails}>
              <Metric title={'Followers'} value={followersCount} />
              <Metric title={'Following'} value={followingCount} />
              <Metric title={'Likes'} value={0} />
            </View>
            <View style={headerStyles.profileActionsContainer}>
              <ToggleButton
                style={headerStyles.profileActionsButton}
                primary
                transparent
                size="small"
                titles={{ on: 'Following', off: 'Follow' }}
              />
              <Button
                style={headerStyles.profileActionsButton}
                transparent
                size="small"
                title="Message"
              />
            </View>
          </View>
        </View>
        <Text
          style={[headerStyles.profileDetailsText, headerStyles.profileName]}>
          {userProfile.name ?? 'No name'}
        </Text>
        <Text style={headerStyles.profileDetailsText}>
          {userProfile.description ?? 'No description'}
        </Text>
      </View>
    </View>
  );
};

const avatarImageRadius = 80;

const metricStyles = StyleSheet.create({
  container: {
    marginRight: values.spacing.md,
    width: 80,
  },
  title: {
    color: colors.white,
    fontSize: typography.size.x,
    paddingBottom: values.spacing.sm,
    textAlign: 'center',
  },
  value: {
    color: colors.white,
    fontWeight: '600',
    fontSize: typography.size.h4,
    textAlign: 'center',
  },
});

const headerStyles = StyleSheet.create({
  headerBackground: {
    height: 360,
  },
  profileDetails: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    paddingVertical: values.spacing.md * 1.25,
    paddingHorizontal: values.spacing.md * 1.5,
    backgroundColor: 'rgba(82, 82, 82, 0.7)',
  },
  profileDetailsText: {
    fontSize: typography.size.sm,
    color: colors.white,
  },
  profileAvatar: {
    borderRadius: avatarImageRadius / 2,
    width: avatarImageRadius,
    height: avatarImageRadius,
    marginRight: values.spacing.xl,
  },
  profileName: {
    fontSize: typography.size.h4,
    marginBottom: values.spacing.sm,
  },
  profileMetrics: {
    marginBottom: values.spacing.md,
    flexDirection: 'row',
  },
  profileMetricsInner: {
    justifyContent: 'center',
  },
  profileMetricsDetails: {
    flexDirection: 'row',
  },
  profileActionsContainer: {
    flexDirection: 'row',
    marginTop: values.spacing.md,
  },
  profileActionsButton: {
    width: 120,
    marginRight: values.spacing.md,
  },
});

const PostsTab = ({ posts }) => {
  const renderedPosts = posts.map((post, key) => ({ key, post }));
  console.log(renderedPosts);
  return (
    <FlatList
      data={renderedPosts}
      numColumns={2}
      renderItem={({ item: { post } }) => (
        <Image
          style={{
            height: 200,
            width: '50%',
            borderRadius: values.radius.md,
          }}
          source={post.imagePreviewSource}
        />
      )}
    />
  );
};

const NotesTab = (_) => <Text>NOTES</Text>;

const LikedTab = (_) => <Text>LIKED</Text>;

const ProfileScreen = (props) => {
  const routeParams = props.route?.params;

  const [posts, setPosts] = useState([]);

  if (!routeParams) {
    return (
      <SafeAreaView>
        <Text>TODO: My User Profile</Text>
      </SafeAreaView>
    );
  }

  useEffect(() => {
    fetchData('posts', setPosts, routeParams, props.userDetails);
    // fetchData('likedPosts', routeParams, props.userDetails);
    // fetchData('notes', routeParams, props.userDetails);

    return () => {
      // This function is called when this component unmounts. Add cleanup code
      // here to deleting asynchronous subscriptions.
    };
  }, []);

  return (
    <>
      <ProfileScreenHeader userProfile={routeParams?.userProfile} />
      <Tab.Navigator>
        <Tab.Screen name="Posts" children={() => <PostsTab posts={posts} />} />
        <Tab.Screen name="Notes" component={NotesTab} />
        <Tab.Screen name="Liked" component={LikedTab} />
      </Tab.Navigator>
    </>
  );
};

const mapStateToProps = (state) => {
  const {
    cachedState: { userPosts, notes, likedPosts } = {},
    userState: { userDetails = {} } = {},
  } = state;

  return {
    userDetails,
    notes: notes ?? [],
    likedPosts: likedPosts ?? [],
    userPosts: userPosts ?? [],
  };
};

export default connect(mapStateToProps)(ProfileScreen);
