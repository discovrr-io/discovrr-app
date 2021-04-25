import React, { useEffect, useState } from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import MasonryList from 'react-native-masonry-list';
import { connect } from 'react-redux';

import { colors, typography, values } from './constants';
import { Button, PostItem, PostItemKind, ToggleButton } from './components';

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
      let postType = PostItemKind.IMAGE; // default value

      const images = item.get('media');
      const imagePreview = (Array.isArray(images) && images[0]) || null;
      const imagePreviewUrl = imagePreview?.url ?? null;

      const imagePreviewDimensions = {
        width: imagePreview.width,
        height: imagePreview.height,
      };

      if (!imagePreviewUrl) {
        postType = PostItemKind.TEXT;
      }

      // We use a placeholder if it is a text post.
      const imagePreviewSource = imagePreviewUrl
        ? { uri: imagePreviewUrl }
        : imagePlaceholder;

      return {
        images,
        postType,
        source: imagePreviewSource,
        dimensions: imagePreviewDimensions,
        author: {
          avatar: item.get('profile')?.get('avatar') ?? undefined,
          name: item.get('profile')?.get('name') ?? undefined,
        },
        caption: item.get('caption') || '[NO CAPTION]',
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
    width: '100%',
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
  return (
    <View style={{ height: '100%' }}>
      <MasonryList
        sorted
        // spacing={1.5}
        images={posts}
        initialNumInColsToRender={1}
        listContainerStyle={{
          paddingBottom: values.spacing.xl,
        }}
        backgroundColor={colors.white}
        completeCustomComponent={({ data }) => (
          <PostItem
            kind={PostItemKind.IMAGE}
            text={data.caption}
            imagePreview={data.source}
            author={data.author}
            metrics={{ likes: 4, isLiked: true, isSaved: true }}
            imagePreviewDimensions={data.masonryDimensions}
            // displayFooter={false}
          />
        )}
      />
    </View>
  );
};

const NotesTab = (_) => <Text>NOTES</Text>;

const LikedTab = (_) => {
  return (
    // <PostItem
    //   kind={PostItemKind.IMAGE}
    //   text="I'm in Marrickville, anyone know a good place for a sausage roll?"
    //   author={{
    //     avatar:
    //       'https://lh3.googleusercontent.com/a-/AOh14GipLN2XblA67SS_Agp7k6p_c6RGdTRa_moJN-li=s96-c',
    //     name: 'Maggie Liu',
    //   }}
    //   metrics={{ likes: 4, isLiked: true, isSaved: true }}
    //   imagePreview={{
    //     uri:
    //       'https://firebasestorage.googleapis.com/v0/b/discovrrapp-88c28.appspot.com/o/post%2Fenjaga_w5r3gg3jcp.jpg?alt=media&token=04a3f960-817b-49eb-9296-fca59905f6f4',
    //     // 'https://firebasestorage.googleapis.com/v0/b/discovrrapp-88c28.appspot.com/o/post%2Fenjaga_hzr5uhpi7re.jpg?alt=media&token=ec4aa5e4-9284-44d1-8eb8-f66976422956',
    //   }}
    //   imagePreviewDimensions={{ width: 1066, height: 800 }}
    //   style={{ width: 200 }}
    // />
    <Text>LIKES</Text>
  );
};

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
  }, [setPosts]);

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
