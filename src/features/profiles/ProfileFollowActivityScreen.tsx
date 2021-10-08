import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import { useNavigation } from '@react-navigation/core';

import { color, font, layout } from 'src/constants';
import { DEFAULT_AVATAR } from 'src/constants/media';
import { SOMETHING_WENT_WRONG } from 'src/constants/strings';
import { useAppDispatch, useIsInitialRender } from 'src/hooks';
import { Profile, ProfileId } from 'src/models';

import {
  AsyncGate,
  EmptyContainer,
  LoadingContainer,
  RouteError,
  Spacer,
} from 'src/components';

import {
  RootStackNavigationProp,
  ProfileStackParamList,
  ProfileStackScreenProps,
} from 'src/navigation';

import { useIsMyProfile, useProfile } from './hooks';
import { fetchProfileById } from './profiles-slice';

const AVATAR_DIAMETER = 45;

export default function ProfileFollowActivityScreenWrapper(
  props: ProfileStackScreenProps<'ProfileFollowActivity'>,
) {
  const { profileId, selector } = props.route.params;
  const profileData = useProfile(profileId);

  return (
    <AsyncGate
      data={profileData}
      onPending={() => <LoadingContainer />}
      onFulfilled={profile => {
        if (!profile) return <RouteError />;
        return (
          <ProfileFollowActivityScreen profile={profile} selector={selector} />
        );
      }}
      onRejected={_ => <RouteError />}
    />
  );
}

type ProfileFollowActivityScreenProps = {
  profile: Profile;
  selector: ProfileStackParamList['ProfileFollowActivity']['selector'];
};

function ProfileFollowActivityScreen(props: ProfileFollowActivityScreenProps) {
  const $FUNC = '[ProfileFollowActivityScreen]';
  const { profile, selector } = props;
  const dispatch = useAppDispatch();

  const data = useMemo(() => {
    // Immutably sort latest profiles first by cloning them first via `slice`
    return selector === 'followers'
      ? profile.followers?.slice().reverse() ?? []
      : profile.following?.slice().reverse() ?? [];
  }, [profile.followers, profile.following, selector]);

  const isMyProfile = useIsMyProfile(profile.id);
  const isInitialRender = useIsInitialRender();
  const [shouldRefresh, setShouldRefresh] = useState(false);

  useEffect(() => {
    if (isInitialRender || shouldRefresh)
      (async () => {
        try {
          await dispatch(
            fetchProfileById({ profileId: profile.id, reload: true }),
          ).unwrap();
        } catch (error) {
          console.error($FUNC, 'Failed to refresh profile:', error);
          Alert.alert(
            SOMETHING_WENT_WRONG.title,
            "We weren't able to refresh this profile. Please try again later.",
          );
        } finally {
          if (shouldRefresh) setShouldRefresh(false);
        }
      })();
  }, [dispatch, isInitialRender, shouldRefresh, profile.id]);

  const handleRefresh = () => {
    if (!shouldRefresh) setShouldRefresh(true);
  };

  return (
    <SafeAreaView style={{ flexGrow: 1 }}>
      <FlatList
        data={data}
        keyExtractor={item => String(item)}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl
            tintColor={color.gray500}
            titleColor={color.gray700}
            // We don't want to see the refreshing logo on initial mount
            refreshing={!isInitialRender && shouldRefresh}
            onRefresh={handleRefresh}
          />
        }
        ItemSeparatorComponent={() => (
          <View
            style={{
              marginHorizontal: layout.spacing.md,
              borderBottomWidth: layout.border.thin,
              borderColor: color.gray100,
            }}
          />
        )}
        ListEmptyComponent={() => (
          <EmptyContainer
            message={`${
              isMyProfile
                ? "You aren't"
                : (profile.displayName || 'This user') + " isn't"
            } ${
              selector === 'followers'
                ? 'followed by anyone'
                : 'following anyone'
            }`}
          />
        )}
        renderItem={({ item }) => (
          <FollowActivityProfileItemWrapper profileId={item} />
        )}
      />
    </SafeAreaView>
  );
}

type FollowActivityProfileItemWrapperProps = {
  profileId: ProfileId;
};

function FollowActivityProfileItemWrapper(
  props: FollowActivityProfileItemWrapperProps,
) {
  const profileData = useProfile(props.profileId);
  return (
    <AsyncGate
      data={profileData}
      onPending={() => <FollowActivityProfileItem.Pending />}
      onFulfilled={profile => {
        if (!profile) return null;
        return <FollowActivityProfileItem profile={profile} />;
      }}
    />
  );
}

type FollowActivityProfileItemProps = {
  profile: Profile;
};

const FollowActivityProfileItem = (props: FollowActivityProfileItemProps) => {
  const { profile } = props;
  const navigation = useNavigation<RootStackNavigationProp>();
  const isMyProfile = useIsMyProfile(profile.id);

  const handlePressProfile = () => {
    navigation.push('ProfileDetails', {
      profileId: profile.id,
      profileDisplayName: profile.displayName,
    });
  };

  return (
    <TouchableHighlight
      underlayColor={color.gray100}
      onPress={handlePressProfile}>
      <View style={followActivityProfileItemStyles.container}>
        <FastImage
          source={profile.avatar ? { uri: profile.avatar.url } : DEFAULT_AVATAR}
          style={followActivityProfileItemStyles.avatar}
        />
        <View style={followActivityProfileItemStyles.innerContainer}>
          <Text
            style={[
              isMyProfile
                ? [font.mediumBold, { color: color.accent }]
                : font.medium,
            ]}>
            {isMyProfile ? 'You' : profile.displayName}
          </Text>
          <Spacer.Vertical value={layout.spacing.xs} />
          <Text style={[font.small, { color: color.gray500 }]}>
            {profile.biography || 'No biography'}
          </Text>
        </View>
        <Icon name="chevron-forward" size={24} color={color.black} />
      </View>
    </TouchableHighlight>
  );
};

// eslint-disable-next-line react/display-name
FollowActivityProfileItem.Pending = () => (
  <View style={followActivityProfileItemStyles.container}>
    <View style={followActivityProfileItemStyles.avatar} />
    <View style={followActivityProfileItemStyles.innerContainer}>
      <View
        style={{ height: 19, width: '45%', backgroundColor: color.placeholder }}
      />
      <Spacer.Vertical value={layout.spacing.xs} />
      <View
        style={{ height: 17, width: '75%', backgroundColor: color.placeholder }}
      />
    </View>
  </View>
);

const followActivityProfileItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layout.spacing.md,
    paddingHorizontal: layout.spacing.md,
  },
  avatar: {
    width: AVATAR_DIAMETER,
    height: AVATAR_DIAMETER,
    borderRadius: AVATAR_DIAMETER / 2,
    backgroundColor: color.placeholder,
  },
  innerContainer: {
    flexGrow: 1,
    flexShrink: 1,
    marginHorizontal: layout.spacing.md,
  },
});
