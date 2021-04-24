import React from 'react';
import { Image, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { connect } from 'react-redux';

import { typography, values } from './constants';
import { Button, ToggleButton } from './components';

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

/*
const Parse = require('parse/react-native');

async function fetchData(selector, routeParams, userDetails) {
  const { isUserProfile, userProfile } = routeParams;

  try {
    const currentUser = await Parse.User.currentAsync();
    if (!currentUser) return;

    const profileId = isUserProfile
      ? userProfile.profileId
      : userDetails.profileId;

    switch (selector) {
      case 'posts':
        break;

      case 'likedPosts':
        const Profile = Parse.Object.extend('Profile');
        const profilePointer = new Profile();
        profilePointer.id = profileId;

        const likedPostsRelation = profilePointer.relation('likedPosts');
        const query = likedPostsRelation.query();
        query.equalTo('status', 0);

        const results = await query.find();
        if (Array.isArray(results) && results.length) {
          const { userId } = userDetails;
        }

        break;

      case 'notes':
        await fetchNotes(isUserProfile, userProfile, currentUser);
        break;

      default:
        console.log(`Unhandled selector: ${selector}`);
        break;
    }
  } catch (error) {
    console.error(`An error occurred: ${error}`);
  }
}

async function fetchNotes(isUserProfile, userProfile, currentUser) {
  const userPointer = isUserProfile
    ? { __type: 'Pointer', className: '_User', objectId: userProfile._id }
    : currentUser;

  const query = new Parse.Query(Parse.Object.extend('Board'));
  query.equalTo('owner', userPointer);
  const results = await query.find();

  if (Array.isArray(results) && results.length) {
    const _ = results.map((_) => {});
  }
}
*/

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
      <Text style={metricStyles.value}>{value}</Text>
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
          {userProfile.name}
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
    color: 'white',
    fontSize: typography.size.x,
  },
  value: {
    color: 'white',
    fontWeight: '600',
    fontSize: typography.size.h4,
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
    backgroundColor: 'rgba(82, 82, 82, 0.6)',
  },
  profileDetailsText: {
    fontSize: typography.size.sm,
    color: 'white',
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
    width: 100,
    marginRight: values.spacing.md,
  },
});

const ProfileScreen = (props) => {
  const routeParams = props.route?.params;

  if (!routeParams) {
    return (
      <SafeAreaView>
        <Text>TODO: My User Profile</Text>
      </SafeAreaView>
    );
  }

  // useEffect(() => {
  //   fetchData('posts', routeParams, props.userDetails);
  //   fetchData('likedPosts', routeParams, props.userDetails);
  //   fetchData('notes', routeParams, props.userDetails);
  //
  //   return () => {
  //     // This function is called when this component unmounts. Add cleanup code
  //     // here to deleting asynchronous subscriptions.
  //   };
  // }, []);

  const ExampleComponent = () => (
    <View>
      <Text>Example!</Text>
    </View>
  );

  return (
    <View>
      <ProfileScreenHeader userProfile={routeParams?.userProfile} />
      <Tab.Navigator>
        <Tab.Screen name="Posts" component={ExampleComponent} />
        <Tab.Screen name="Notes" component={ExampleComponent} />
        <Tab.Screen name="Liked" component={ExampleComponent} />
      </Tab.Navigator>
    </View>
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
