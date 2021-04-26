import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
// import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MasonryList from 'react-native-masonry-list';
import { connect } from 'react-redux';

import { colors, typography, values } from './constants';
import { Button, PostItem, PostItemKind, ToggleButton } from './components';

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const Parse = require('parse/react-native');

async function fetchPosts(userProfile) {
  const { profileId } = userProfile;
  const profilePointer = {
    __type: 'Pointer',
    classNae: 'Profile',
    objectId: profileId,
  };

  // We won't handle exceptions here
  const query = new Parse.Query(Parse.Object.extend('Post'));
  query.include('profile');
  query.equalTo('profile', profilePointer);

  query.greaterThanOrEqualTo('createdAt', new Date('2020-10-30'));
  query.descending('createdAt');

  const results = await query.find();
  console.log({ resultsLength: results.length });

  const posts = results.map((post) => {
    console.log({ images: post.get('media') });
  });

  return posts;
}

const ProfileScreenHeader = ({ isMyProfile, userProfile }) => {
  const {
    avatar: { url: avatarUrl } = {},
    coverPhoto: { url: coverPhotoUrl } = {},
    followersCount = 0,
    followingCount = 0,
  } = userProfile;

  const profileName =
    userProfile.name && userProfile.name.length > 0
      ? userProfile.name
      : 'No name';
  const profileDescription =
    userProfile.description && userProfile.description.length > 0
      ? userProfile.description
      : 'No description';

  const headerImage = coverPhotoUrl ? { uri: coverPhotoUrl } : imagePlaceholder;
  const avatarImage = avatarUrl ? { uri: avatarUrl } : defaultAvatar;

  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);
  const [isHeaderLoaded, setIsHeaderLoaded] = useState(false);

  const onAvatarLoaded = (loadEvent) => {
    if (loadEvent) setIsAvatarLoaded(true);
  };

  const onHeaderLoaded = (loadEvent) => {
    if (loadEvent) setIsHeaderLoaded(true);
  };

  const alertUnavailableFeature = () => {
    Alert.alert(`Sorry, this feature isn't available at the moment.`);
  };

  const onFollowingButtonPress = (_) => alertUnavailableFeature();
  const onMessageButtonPress = (_) => alertUnavailableFeature();
  const onEditProfileButtonPress = (_) => alertUnavailableFeature();

  const Metric = ({ title, value, ...props }) => (
    <View {...(props.style ?? {})} style={metricStyles.container}>
      <Text style={metricStyles.title}>{title}</Text>
      <Text style={metricStyles.value}>
        {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
    </View>
  );

  return (
    <View>
      <Image
        onLoad={onHeaderLoaded}
        style={headerStyles.headerBackground}
        source={isHeaderLoaded ? headerImage : imagePlaceholder}
      />
      <View style={headerStyles.profileDetails}>
        {/* {isMyProfile && (
          <View style={headerStyles.profileEditButton}>
            <MaterialIcon name="edit" size={20} color={colors.white} />
          </View>
        )} */}
        <View style={headerStyles.profileMetrics}>
          <Image
            onLoad={onAvatarLoaded}
            style={headerStyles.profileAvatar}
            source={isAvatarLoaded ? avatarImage : defaultAvatar}
          />
          <View style={headerStyles.profileMetricsInner}>
            <View style={headerStyles.profileMetricsDetails}>
              <Metric title={'Followers'} value={followersCount} />
              <Metric title={'Following'} value={followingCount} />
              <Metric title={'Likes'} value={0} />
            </View>
            <View style={headerStyles.profileActionsContainer}>
              {isMyProfile ? (
                <>
                  <Button
                    style={headerStyles.profileActionsButton}
                    transparent
                    size="small"
                    title="Edit Profile"
                    onPress={onEditProfileButtonPress}
                  />
                </>
              ) : (
                <>
                  <ToggleButton
                    style={headerStyles.profileActionsButton}
                    primary
                    transparent
                    size="small"
                    titles={{ on: 'Following', off: 'Follow' }}
                    onPress={onFollowingButtonPress}
                  />
                  <Button
                    style={headerStyles.profileActionsButton}
                    transparent
                    size="small"
                    title="Message"
                    onPress={onMessageButtonPress}
                  />
                </>
              )}
            </View>
          </View>
        </View>
        <Text
          style={[headerStyles.profileDetailsText, headerStyles.profileName]}>
          {profileName}
        </Text>
        <Text style={headerStyles.profileDetailsText}>
          {profileDescription}
        </Text>
      </View>
    </View>
  );
};

const avatarImageRadius = 80;

const metricStyles = StyleSheet.create({
  container: {
    width: 85,
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
  profileEditButton: {
    position: 'absolute',
    top: values.spacing.md * 1.25,
    right: values.spacing.md * 1.5,
    backgroundColor: colors.gray,
    padding: values.spacing.sm * 1.5,
    borderRadius: values.radius.lg,
  },
  profileDetails: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    paddingVertical: values.spacing.md * 1.25,
    paddingHorizontal: values.spacing.md * 1.5,
    backgroundColor: 'rgba(82, 82, 82, 0.8)',
  },
  profileDetailsText: {
    fontSize: typography.size.sm,
    color: colors.white,
  },
  profileAvatar: {
    borderRadius: avatarImageRadius / 2,
    width: avatarImageRadius,
    height: avatarImageRadius,
    marginRight: values.spacing.lg,
  },
  profileName: {
    fontSize: typography.size.h4,
    marginBottom: values.spacing.sm,
  },
  profileMetrics: {
    flexDirection: 'row',
    marginBottom: values.spacing.md,
  },
  profileMetricsInner: {
    flex: 1,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  profileMetricsDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  profileActionsContainer: {
    flexDirection: 'row',
    marginTop: values.spacing.md,
  },
  profileActionsButton: {
    flex: 1,
    marginRight: values.spacing.md,
    alignSelf: 'stretch',
  },
});

const LoadingTabView = ({ message }) => {
  return (
    <View
      style={{
        height: '100%',
        backgroundColor: colors.white,
        justifyContent: 'space-around',
      }}>
      <View>
        <ActivityIndicator
          style={{ marginBottom: values.spacing.md }}
          size="large"
        />
        <Text style={{ fontSize: typography.size.md, textAlign: 'center' }}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const EmptyTabView = ({ message }) => {
  return (
    <View
      style={{
        height: '100%',
        backgroundColor: colors.white,
        justifyContent: 'space-around',
      }}>
      <View>
        <Text
          style={{
            fontSize: 36,
            textAlign: 'center',
            marginBottom: values.spacing.md,
          }}>
          🤔
        </Text>
        <Text style={{ fontSize: typography.size.md, textAlign: 'center' }}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const PostsTab = ({ userProfile }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);
  console.log(posts);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const posts = await fetchPosts(userProfile);
        setPosts(posts);
        setIsLoading(false);
      } catch (error) {
        setPosts([]);
        setIsLoading(false);
        setError(error);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <LoadingTabView message="Loading Posts..." />;
  }

  if (error) {
    return (
      <View
        style={{
          height: '100%',
          backgroundColor: colors.white,
          justifyContent: 'space-around',
        }}>
        <Text style={{ textAlign: 'center' }}>{error.message ?? error}</Text>
      </View>
    );
  }

  return (
    <View style={{ height: '100%' }}>
      <MasonryList
        sorted
        images={posts}
        initialNumInColsToRender={1}
        listContainerStyle={{
          paddingTop: values.spacing.sm,
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
            displayFooter={false}
          />
        )}
        emptyView={() => <EmptyTabView message="No Posts" />}
      />
    </View>
  );
};

const NotesTab = (_) => <Text>NOTES</Text>;
const LikedTab = (_) => <Text>LIKES</Text>;

const Tab = createMaterialTopTabNavigator();

const ProfileScreen = (props) => {
  const {
    userDetails: myUserDetails,
    route: { params },
  } = props;

  console.log({ params } ?? 'NO ROUTE PARAMS');

  const isMyProfile = !params;
  const { userProfile } = params ?? { userProfile: myUserDetails };

  return (
    <>
      <ProfileScreenHeader
        isMyProfile={isMyProfile}
        userProfile={userProfile}
      />
      <Tab.Navigator
        lazy={true}
        tabBarOptions={{ indicatorStyle: { backgroundColor: colors.accent } }}>
        <Tab.Screen
          name="Posts"
          children={() => <PostsTab userProfile={userProfile} />}
        />
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
