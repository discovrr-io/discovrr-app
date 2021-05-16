import React, { useEffect, useState } from 'react';
import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import { useNavigation } from '@react-navigation/native';
import { connect } from 'react-redux';
import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

import { EmptyTabView, ErrorTabView, LoadingTabView } from './components';
import { colors, typography, values } from './constants';

const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');
const Parse = require('parse/react-native');

async function fetchData(userProfile, selector) {
  const Profile = Parse.Object.extend('Profile');
  const profilePointer = new Profile();
  profilePointer.id = userProfile.id;

  const type = selector === 'Followers' ? 'followers' : 'following';
  const userRelation = profilePointer.relation(type);
  const query = userRelation.query();
  const results = await query.find();

  if (!Array.isArray(results)) {
    throw new Error(`The type of results is not Array.`);
  }

  const items = results.map((item) => {
    return {
      id: item.id,
      avatar: item.get('avatar'),
      name: item.get('name'),
      description: item.get('description') ?? 'No description',
      coverPhoto: item.get('coverPhoto'),
    };
  });

  return items;
}

const AVATAR_IMAGE_RADIUS = 45;

const UserListItem = ({ item }) => {
  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);

  const navigation = useNavigation();
  const avatar = item.avatar ? { uri: item.avatar.url } : defaultAvatar;
  const name = (item.name ?? '').length === 0 ? 'Anonymous' : item.name;

  const onLoadAvatar = (loadEvent) => {
    if (loadEvent) setIsAvatarLoaded(true);
  };

  const handleGoToProfile = () => {
    navigation.push('UserProfileScreen', {
      userProfile: item,
      fetchUser: true,
    });
  };

  return (
    <TouchableHighlight
      underlayColor={colors.gray200}
      onPress={handleGoToProfile}>
      <View style={userListItemStyles.container}>
        <FastImage
          onLoad={onLoadAvatar}
          source={isAvatarLoaded ? avatar : defaultAvatar}
          width={AVATAR_IMAGE_RADIUS}
          height={AVATAR_IMAGE_RADIUS}
          style={userListItemStyles.avatar}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={userListItemStyles.textContainer}>
          <Text style={userListItemStyles.name}>{name}</Text>
          <Text
            style={userListItemStyles.description}
            numberOfLines={1}
            ellipsizeMode="tail">
            {item.description}
          </Text>
        </View>
        <MaterialIcon name="chevron-right" size={AVATAR_IMAGE_RADIUS * 0.75} />
      </View>
    </TouchableHighlight>
  );
};

const userListItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: values.spacing.md,
    paddingVertical: values.spacing.lg * 0.75,
    alignItems: 'center',
  },
  avatar: {
    borderRadius: AVATAR_IMAGE_RADIUS / 2,
    width: AVATAR_IMAGE_RADIUS,
    height: AVATAR_IMAGE_RADIUS,
  },
  textContainer: {
    flex: 1,
    alignSelf: 'center',
    marginLeft: values.spacing.md,
    marginTop: values.spacing.sm,
  },
  name: {
    flex: 1,
    color: colors.black,
    fontSize: typography.size.md,
  },
  description: {
    flex: 1,
    color: colors.gray700,
    fontSize: typography.size.sm,
  },
});

const FollowerScreen = ({ route }) => {
  const {
    params: { userProfile, selector },
  } = route;

  const [items, setItems] = useState([]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const _fetchData = async () => {
      try {
        const items = await fetchData(userProfile, selector);
        setItems(items);
      } catch (error) {
        setItems([]);
        setError(error);
        console.error(`${error.message ?? error}`);
      }

      setIsLoading(false);
      setIsRefreshing(false);
    };

    if (isLoading || isRefreshing) _fetchData();
  }, [isRefreshing]); // This will run whenever `isRefreshing` changes

  const handleRefresh = () => {
    if (!isRefreshing) setIsRefreshing(true);
  };

  if (isLoading) {
    return <LoadingTabView message="Loading..." />;
  }

  if (error) {
    return <ErrorTabView error={error} />;
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={items}
        renderItem={({ item }) => <UserListItem item={item} />}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.black]}
            tintColor={colors.black}
          />
        }
        ItemSeparatorComponent={() => (
          <View
            style={{
              borderBottomColor: colors.gray200,
              borderBottomWidth: values.border.thin,
              marginHorizontal: values.spacing.lg,
            }}
          />
        )}
        ListEmptyComponent={() => (
          <EmptyTabView
            message={
              selector === 'Followers'
                ? "This user doesn't have any followers"
                : "This user isn't following anyone"
            }
          />
        )}
      />
    </SafeAreaView>
  );
};

const mapStateToProps = (state) => {
  const followingArray = state?.userState?.userDetails?.followingArray ?? [];
  const profileId = state?.userState?.userDetails?.profileId ?? null;

  return {
    followingArray,
    profileId,
  };
};

export default connect(mapStateToProps)(FollowerScreen);
