import React, { useState } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';

import { EmptyTabView, RouteError } from '../../components';
import { selectProfileById } from './profilesSlice';
import { colors, typography, values } from '../../constants';
import { DEFAULT_AVATAR } from '../../constants/media';

const AVATAR_IMAGE_RADIUS = 45;

function UserListItem({ profileId }) {
  const navigation = useNavigation();

  const profile = useSelector((state) => selectProfileById(state, profileId));
  if (!profile) {
    console.error(
      '[UserListItem] Failed to select profile with id:',
      profileId,
    );
    return null;
  }

  const { avatar, fullName, description } = profile;

  const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);

  const onLoadAvatar = (loadEvent) => {
    if (loadEvent) setIsAvatarLoaded(true);
  };

  const handlePressProfile = () => {
    navigation.push('UserProfileScreen', { profileId, profileName: fullName });
  };

  return (
    <TouchableHighlight
      underlayColor={colors.gray200}
      onPress={handlePressProfile}>
      <View style={userListItemStyles.container}>
        <FastImage
          onLoad={onLoadAvatar}
          source={isAvatarLoaded ? avatar : DEFAULT_AVATAR}
          width={AVATAR_IMAGE_RADIUS}
          height={AVATAR_IMAGE_RADIUS}
          style={userListItemStyles.avatar}
          resizeMode="cover"
        />
        <View style={userListItemStyles.textContainer}>
          <Text style={userListItemStyles.name}>{fullName || 'Anonymous'}</Text>
          <Text
            style={userListItemStyles.description}
            numberOfLines={1}
            ellipsizeMode="tail">
            {description || 'No description'}
          </Text>
        </View>
        <Icon name="chevron-right" size={AVATAR_IMAGE_RADIUS * 0.75} />
      </View>
    </TouchableHighlight>
  );
}

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

export default function FollowerScreen() {
  /**
   * @typedef {import('../../models').ProfileId} ProfileId
   * @typedef {'followers' | 'following'} Selector
   * @type {{ profileId: ProfileId, selector: Selector }} */
  const { profileId, selector } = useRoute().params ?? {};

  const profile = useSelector((state) => selectProfileById(state, profileId));
  if (!profile) {
    console.error(
      '[FollowerScreen] Failed to select profile with id:',
      profileId,
    );
    return <RouteError />;
  }

  const profileIds =
    selector === 'following' ? profile.following : profile.followers;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.white }}>
      <FlatList
        data={profileIds ?? []}
        keyExtractor={(item) => String(item)}
        renderItem={({ item: profileId }) => (
          <UserListItem profileId={profileId} />
        )}
        ItemSeparatorComponent={() => (
          <View
            style={{
              borderBottomColor: colors.gray200,
              borderBottomWidth: values.border.thin,
              marginHorizontal: values.spacing.lg,
            }}
          />
        )}
        ListEmptyComponent={
          <EmptyTabView
            message={
              selector === 'followers'
                ? "This user doesn't have any followers"
                : "This user isn't following anyone"
            }
          />
        }
      />
    </SafeAreaView>
  );
}
