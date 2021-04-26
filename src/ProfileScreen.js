import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import MasonryList from 'react-native-masonry-list';
import { connect } from 'react-redux';

import { colors, typography, values } from './constants';
import { Button, PostItem, PostItemKind, ToggleButton } from './components';

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const Parse = require('parse/react-native');

const ProfileScreenHeader = ({ userProfile }) => {
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

  const onMessageButtonPress = (_) => {
    Alert.alert(`Sorry, this feature isn't available at the moment.`);
  };

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
                onPress={onMessageButtonPress}
              />
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

const PostsTab = (_) => {
  const posts = [];
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
      />
    </View>
  );
};

const NotesTab = (_) => <Text>NOTES</Text>;
const LikedTab = (_) => <Text>LIKES</Text>;

const Tab = createMaterialTopTabNavigator();

const ProfileScreen = (props) => {
  const routeParams = props.route?.params;

  if (!routeParams) {
    return (
      <SafeAreaView>
        <Text>TODO: My User Profile</Text>
      </SafeAreaView>
    );
  }

  return (
    <>
      <ProfileScreenHeader userProfile={routeParams.userProfile} />
      {/* <Tab.Navigator>
        <Tab.Screen name="Posts" component={PostsTab} />
        <Tab.Screen name="Notes" component={NotesTab} />
        <Tab.Screen name="Liked" component={LikedTab} />
      </Tab.Navigator> */}
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
