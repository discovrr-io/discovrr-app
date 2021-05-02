import React, { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, View } from 'react-native';

import { Tabs } from 'react-native-collapsible-tab-view';
import MasonryList from 'react-native-masonry-list';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {
  useSafeAreaInsets,
  withSafeAreaInsets,
} from 'react-native-safe-area-context';

import { connect } from 'react-redux';

import {
  Button,
  EmptyTabView,
  ErrorTabView,
  LoadingTabView,
  PostItem,
  PostItemKind,
  ToggleButton,
} from './components';
import { colors, typography, values } from './constants';

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const Parse = require('parse/react-native');

async function fetchPosts(userProfile) {
  const { id: profileId } = userProfile;
  const profilePointer = {
    __type: 'Pointer',
    className: 'Profile',
    objectId: profileId,
  };

  // We won't handle exceptions here
  const query = new Parse.Query(Parse.Object.extend('Post'));
  query.include('profile');
  query.equalTo('profile', profilePointer);

  query.greaterThanOrEqualTo('createdAt', new Date('2020-10-30'));
  query.descending('createdAt');

  const results = await query.find();
  const posts = results.map((post) => {
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
        name: post.get('profile')?.get('name'),
        avatar: post.get('profile')?.get('avatar'),
      },
      id: post.id,
      key: `${imagePreviewUrl ?? imagePlaceholder}`,
      postType,
      images,
      source: imagePreviewSource,
      dimensions: imagePreviewDimensions,
      caption: post.get('caption'),
      likesCount,
      hasLiked,
      viewersCount: post.get('viewersCount'),
      __refactored: true,
    };
  });

  return posts;
}

const ProfileScreenHeader = ({ isMyProfile, userProfile, ...props }) => {
  const {
    avatar: { url: avatarUrl } = {},
    coverPhoto: { url: coverPhotoUrl } = {},
    followersCount = 0,
    followingCount = 0,
  } = userProfile;

  const profileName =
    userProfile.name && userProfile.name.length > 0
      ? userProfile.name
      : 'Anonymous';
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
    <View pointerEvents="box-none" style={[props.style]}>
      <Image
        onLoad={onHeaderLoaded}
        style={headerStyles.headerBackground}
        source={isHeaderLoaded ? headerImage : imagePlaceholder}
      />
      <View style={headerStyles.profileDetails}>
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

const HEADER_MAX_HEIGHT = 320;
const HEADER_MIN_HEIGHT = 60;
// const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

const AVATAR_IMAGE_RADIUS = 80;

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
    height: HEADER_MAX_HEIGHT,
    width: '100%',
  },
  profileBackButton: {
    backgroundColor: colors.gray,
    padding: values.spacing.sm, // * 1.5,
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
    borderRadius: AVATAR_IMAGE_RADIUS / 2,
    width: AVATAR_IMAGE_RADIUS,
    height: AVATAR_IMAGE_RADIUS,
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

const PostsTab = ({ userProfile, navigation }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [posts, setPosts] = useState([]);
  const [error, setError] = useState(null);

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
        console.error(`Failed to fetch posts: ${error}`);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <LoadingTabView message="Loading posts..." />;
  }

  if (error) {
    return <ErrorTabView error={error} />;
  }

  const handlePostItemPress = (postData) => {
    const postDetails = {
      ...postData,
      user: {},
      pinPostToNote: () => {},
      refreshData: () => {},
    };

    navigation.navigate('PostDetailScreen', postDetails);
  };

  return (
    <MasonryList
      sorted
      rerender
      columns={2}
      images={posts}
      initialNumInColsToRender={1}
      listContainerStyle={{ paddingTop: values.spacing.sm }}
      backgroundColor={colors.white}
      emptyView={() => <EmptyTabView />}
      completeCustomComponent={({ data }) => (
        <PostItem
          kind={data.postType}
          text={data.caption}
          author={data.author}
          metrics={{ likes: 4, isLiked: true, isSaved: true }}
          column={data.column}
          imagePreview={data.source}
          imagePreviewDimensions={data.masonryDimensions}
          displayFooter={false}
          onPressPost={() => handlePostItemPress(data)}
        />
      )}
    />
  );
};

const NotesTab = (_) => <Text>NOTES</Text>;

const ProfileScreen = (props) => {
  const {
    userDetails: myUserDetails,
    route: { params },
  } = props;

  const isMyProfile = !params;
  const { userProfile } = params ?? { userProfile: myUserDetails };
  const { top: topInset } = useSafeAreaInsets();

  return (
    <>
      <View
        style={[
          headerStyles.profileBackButton,
          {
            zIndex: 1,
            position: 'absolute',
            top: topInset + values.spacing.xs,
            left: values.spacing.md,
          },
        ]}>
        <MaterialIcon
          name="chevron-left"
          size={28}
          color={colors.white}
          onPress={props.navigation.goBack}
        />
      </View>
      <Tabs.Container
        lazy
        minHeaderHeight={topInset + HEADER_MIN_HEIGHT}
        snapThreshold={0.25}
        HeaderComponent={() => (
          <ProfileScreenHeader
            isMyProfile={isMyProfile}
            userProfile={userProfile}
          />
        )}>
        <Tabs.Tab name="posts" label="Posts">
          <Tabs.ScrollView onScroll={() => console.log('ON_SCROLL')}>
            <PostsTab userProfile={userProfile} navigation={props.navigation} />
          </Tabs.ScrollView>
        </Tabs.Tab>
        <Tabs.Tab name="notes" label="Notes">
          <Tabs.ScrollView>
            <NotesTab />
          </Tabs.ScrollView>
        </Tabs.Tab>
      </Tabs.Container>
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

export default connect(mapStateToProps)(withSafeAreaInsets(ProfileScreen));
