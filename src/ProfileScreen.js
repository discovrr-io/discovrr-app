import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { Tabs } from 'react-native-collapsible-tab-view';
import FastImage from 'react-native-fast-image';
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
  NoteItem,
  PostItem,
  PostItemKind,
  ToggleButton,
} from './components';
import { colors, typography, values } from './constants';

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const Parse = require('parse/react-native');

async function fetchUser(profileId) {
  const query = new Parse.Query('Profile');
  query.equalTo('objectId', profileId);
  query.include('owner');

  // const myProfile = await new Parse.User.currentAsync();
  const profile = await query.first();
  if (!profile) {
    throw new Error(`No user with id '${profileId}' found`);
  }

  return {
    avatar: profile.get('avatar'),
    name: profile.get('name') ?? 'Anonymous',
    description: profile.get('description') ?? 'No description',
    followersCount: profile.get('followersCount'),
    followingCount: profile.get('followingCount'),
    likesCount: profile.get('likedPostsArray').length,
    coverPhoto: profile.get('coverPhoto'),
  };
}

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
    let postType = PostItemKind.MEDIA; // default value

    const media = post.get('media');
    if (Array.isArray(media) && media.length) {
      media.forEach(({ type }, i) => {
        if (type === 'video') media[i].isVideo = true;
      });
    }

    const imagePreview =
      (Array.isArray(media) && media.length && media[0]) ?? null;
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
        likesCount: post.get('profile')?.get('likesCount'),
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

  return posts;
}

async function fetchNotes(userProfile, isMyProfile) {
  const userPointer = {
    __type: 'Pointer',
    className: '_User',
    objectId: isMyProfile ? userProfile.userId : userProfile.ownerId,
  };

  const query = new Parse.Query(Parse.Object.extend('Board'));
  query.equalTo('owner', userPointer);

  const results = await query.find();
  if (!Array.isArray(results)) {
    throw new Error('fetchNotes: The type of results is not Array.');
  }

  const notes = results.map((note) => {
    const imagePreviewData = note.get('image');
    const imagePreviewUrl = imagePreviewData?.url;
    const imagePreviewSource = imagePreviewUrl
      ? { uri: imagePreviewUrl }
      : imagePlaceholder;
    const imagePreviewDimensions = {
      width: imagePreviewData?.width ?? 800,
      height: imagePreviewData?.height ?? 600,
    };

    return {
      id: note.id,
      title: note.get('title'),
      isPrivate: note.get('private'),
      source: imagePreviewSource,
      dimensions: imagePreviewDimensions,
    };
  });

  return notes;
}

const ProfileScreenHeader = ({
  isMyProfile,
  userProfile: givenUserProfile,
  fetchUser: shouldFetchUser = false,
  ...props
}) => {
  const navigation = useNavigation();

  const [userProfile, setUserProfile] = useState(givenUserProfile);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [_isLoading, setIsLoading] = useState(shouldFetchUser);
  const [_error, setError] = useState(null);

  const {
    avatar: { url: avatarUrl } = {},
    coverPhoto: { url: coverPhotoUrl } = {},
    followersCount = 0,
    followingCount = 0,
    likesCount = 0,
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
  // const [currFollowersCount, setCurrFollowersCount] = useState(followersCount);

  const currFollowersCount = useRef(followersCount);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const newUserProfile = await fetchUser(givenUserProfile.id);
        setUserProfile({ ...givenUserProfile, ...newUserProfile });
        console.log({ userProfile });
        currFollowersCount.current = newUserProfile.followersCount;
      } catch (error) {
        setError(error);
        console.error(`Failed to fetch user: ${error.message ?? error}`);
      }

      setIsLoading(false);
    };

    if (shouldFetchUser) fetchData();
  }, []);

  const onAvatarLoaded = (loadEvent) => {
    if (loadEvent) setIsAvatarLoaded(true);
  };

  const onHeaderLoaded = (loadEvent) => {
    if (loadEvent) setIsHeaderLoaded(true);
  };

  const onFollowButtonPress = async (isFollowing) => {
    setIsProcessingFollow(true);

    try {
      await Parse.Cloud.run('followOrUnfollowProfile', {
        profileId: userProfile.id,
        follow: isFollowing,
      });

      // setCurrFollowersCount((prevCount) => prevCount + (isFollowing ? 1 : -1));
      currFollowersCount.current =
        currFollowersCount.current + (isFollowing ? 1 : -1);
    } catch (error) {
      const message = `Failed to ${
        isFollowing ? 'follow' : 'unfollow'
      } user. Please try again later.`;
      Alert.alert(message);
      console.error(message);
    }

    setIsProcessingFollow(false);
  };

  const alertUnavailableFeature = () => {
    Alert.alert(
      'Feature Unavailable',
      "Sorry, this feature isn't available at the moment.",
    );
  };

  const onMessageButtonPress = (_) => {
    alertUnavailableFeature();
  };

  const onEditProfileButtonPress = (_) => {
    navigation.navigate('ProfileEditScreen');
  };

  const handleShowFollowers = () => {
    navigation.push('FollowerScreen', {
      userProfile,
      selector: 'Followers',
    });
  };

  const handleShowFollowing = () => {
    navigation.push('FollowerScreen', {
      userProfile,
      selector: 'Following',
    });
  };

  const Metric = ({ title, value, onPress = () => {}, ...props }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[metricStyles.container, props.style]}>
      <Text style={metricStyles.title}>{title}</Text>
      <Text style={metricStyles.value}>
        {value > 999 ? `${(value / 1000).toFixed(1)}k` : value}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View pointerEvents="box-none" style={[props.style]}>
      <FastImage
        onLoad={onHeaderLoaded}
        style={headerStyles.headerBackground}
        source={isHeaderLoaded ? headerImage : imagePlaceholder}
      />
      <View style={headerStyles.profileDetails}>
        <View style={headerStyles.profileMetrics}>
          <FastImage
            onLoad={onAvatarLoaded}
            style={headerStyles.profileAvatar}
            source={isAvatarLoaded ? avatarImage : defaultAvatar}
          />
          <View style={headerStyles.profileMetricsInner}>
            <View style={headerStyles.profileMetricsDetails}>
              <Metric
                title={'Followers'}
                value={currFollowersCount.current}
                onPress={handleShowFollowers}
              />
              <Metric
                title={'Following'}
                value={followingCount}
                onPress={handleShowFollowing}
              />
              <Metric title={'Likes'} value={likesCount} />
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
                    onPress={onFollowButtonPress}
                    isLoading={isProcessingFollow}
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
    borderRadius: values.radius.md,
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

const PostsTab = ({ userProfile, isMyProfile }) => {
  const navigation = useNavigation();

  const [posts, setPosts] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const posts = await fetchPosts(userProfile);
        setPosts(posts);
      } catch (error) {
        setPosts([]);
        setError(error);
        console.error(`Failed to fetch posts: ${error}`);
      }

      setIsLoading(false);
    };

    if (isLoading || isRefreshing) fetchData();
  }, [isRefreshing]); // This will run whenever `isRefreshing` changes

  const handleRefresh = () => {
    if (!isRefreshing) setIsRefreshing(true);
  };

  const handlePostItemPress = (postData) => {
    const postDetails = {
      ...postData,
    };

    navigation.push('PostDetailScreen', postDetails);
  };

  if (isLoading) {
    return <LoadingTabView message="Loading posts..." />;
  }

  if (error) {
    return <ErrorTabView error={error} />;
  }

  const emptyTabViewMessage =
    (isMyProfile
      ? `You haven't `
      : `${userProfile.name ?? 'This user'} hasn't `) + 'posted anything';

  return (
    <MasonryList
      sorted
      rerender
      columns={2}
      images={posts}
      initialNumInColsToRender={1}
      listContainerStyle={{ paddingTop: values.spacing.sm }}
      backgroundColor={colors.white}
      masonryFlatListColProps={{
        ListEmptyComponent: () => (
          <EmptyTabView
            message={emptyTabViewMessage}
            style={{ width: '100%' }}
          />
        ),
        refreshControl: (
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        ),
      }}
      completeCustomComponent={({ data }) => (
        <PostItem
          id={data.id}
          kind={data.postType}
          text={data.caption}
          author={data.author}
          column={data.column}
          imagePreview={data.source}
          imagePreviewDimensions={data.masonryDimensions}
          displayFooter={false}
          onPressPost={() => handlePostItemPress(data)}
          style={{ marginHorizontal: values.spacing.xs * 1.1 }}
        />
      )}
    />
  );
};

const NotesTab = ({ userProfile, isMyProfile }) => {
  const navigation = useNavigation();

  const [notes, setNotes] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const notes = await fetchNotes(userProfile, isMyProfile);
        setNotes(notes);
      } catch (error) {
        setNotes([]);
        setError(error);
        console.error(`Failed to fetch notes: ${error}`);
      }

      setIsLoading(false);
    };

    if (isLoading || isRefreshing) fetchData();
  }, [isRefreshing]); // This will run whenever `isRefreshing` changes

  const handleRefresh = () => {
    if (!isRefreshing) setIsRefreshing(true);
  };

  if (isLoading) {
    return <LoadingTabView message="Loading notes..." />;
  }

  if (error) {
    return <ErrorTabView error={error} />;
  }

  const emptyTabViewMessage =
    (isMyProfile
      ? `You haven't `
      : `${userProfile.name ?? 'This user'} hasn't `) +
    'created any public notes';

  const handleNoteItemPress = (noteItem) => {
    navigation.push('NoteDetailScreen', {
      noteDetails: noteItem,
      userDetails: userProfile,
      // ...noteItem,
    });
  };

  return (
    <MasonryList
      sorted
      rerender
      columns={2}
      images={notes}
      initialNumInColsToRender={1}
      listContainerStyle={{ paddingTop: values.spacing.sm }}
      backgroundColor={colors.white}
      masonryFlatListColProps={{
        ListEmptyComponent: () => (
          <EmptyTabView
            message={emptyTabViewMessage}
            style={{ width: '100%' }}
          />
        ),
        refreshControl: (
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        ),
      }}
      completeCustomComponent={({ data }) => (
        <NoteItem
          id={data.id}
          title={data.title}
          imagePreview={data.source}
          imagePreviewDimensions={data.masonryDimensions}
          onPressNote={() => handleNoteItemPress(data)}
          style={{ marginHorizontal: values.spacing.xs * 1.1 }}
        />
      )}
    />
  );
};

const ProfileScreen = (props) => {
  const {
    userDetails: myUserDetails,
    route: { params },
  } = props;

  const isMyProfile = !params;
  const { userProfile, fetchUser = false } = params ?? {
    userProfile: myUserDetails,
  };

  const { top: topInset } = useSafeAreaInsets();

  return (
    <>
      {!isMyProfile && (
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
            onPress={() => props.navigation.goBack()}
          />
        </View>
      )}
      <Tabs.Container
        lazy
        minHeaderHeight={topInset + HEADER_MIN_HEIGHT}
        snapThreshold={0.25}
        HeaderComponent={() => (
          <ProfileScreenHeader
            isMyProfile={isMyProfile}
            userProfile={userProfile}
            fetchUser={fetchUser}
          />
        )}>
        <Tabs.Tab name="posts" label="Posts">
          <Tabs.ScrollView
            onScroll={() => console.log('ON_SCROLL')}
            onScrollEndDrag={() => console.log('END DRAG')}
            onMomentumScrollEnd={() => console.log('END SCROLL')}>
            <PostsTab userProfile={userProfile} isMyProfile={isMyProfile} />
          </Tabs.ScrollView>
        </Tabs.Tab>
        <Tabs.Tab name="notes" label="Notes">
          <Tabs.ScrollView>
            <NotesTab userProfile={userProfile} isMyProfile={isMyProfile} />
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
