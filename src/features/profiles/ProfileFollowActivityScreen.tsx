import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, View } from 'react-native';

import { color, layout } from 'src/constants';
import { useAppDispatch, useIsMounted } from 'src/hooks';
import { Profile } from 'src/models';
import { ProfileStackParamList, RootStackScreenProps } from 'src/navigation';
import { alertSomethingWentWrong } from 'src/utilities';

import {
  AsyncGate,
  EmptyContainer,
  LoadingContainer,
  RouteError,
} from 'src/components';

import ProfileListItem from './ProfileListItem';
import { useIsMyProfile, useProfile } from './hooks';
import { fetchProfileById } from './profiles-slice';

// type ProfileFollowActivityScreen = ProfileStackScreenProps<'ProfileFollowActivity'>;
type ProfileFollowActivityScreen =
  RootStackScreenProps<'ProfileFollowActivity'>;

export default function ProfileFollowActivityScreen(
  props: ProfileFollowActivityScreen,
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
          <LoadedProfileFollowActivityScreen
            profile={profile}
            selector={selector}
          />
        );
      }}
      onRejected={_ => <RouteError />}
    />
  );
}

type LoadedProfileFollowActivityScreenProps = {
  profile: Profile;
  selector: ProfileStackParamList['ProfileFollowActivity']['selector'];
};

function LoadedProfileFollowActivityScreen(
  props: LoadedProfileFollowActivityScreenProps,
) {
  const $FUNC = '[ProfileFollowActivityScreen]';
  const { profile, selector } = props;
  const dispatch = useAppDispatch();

  const data = useMemo(() => {
    // Immutably sort latest profiles first by cloning them first via `slice`
    return selector === 'followers'
      ? profile.followers?.slice().reverse() ?? []
      : profile.following?.slice().reverse() ?? [];
  }, [profile.followers, profile.following, selector]);

  const isMyProfile = useIsMyProfile(profile.profileId);
  const isMounted = useIsMounted();

  const [isInitialRender, setIsInitialRender] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  useEffect(() => {
    if (isInitialRender || shouldRefresh)
      (async () => {
        try {
          await dispatch(
            fetchProfileById({ profileId: profile.profileId, reload: true }),
          ).unwrap();
        } catch (error) {
          console.error($FUNC, 'Failed to refresh profile:', error);
          alertSomethingWentWrong(
            "We weren't able to refresh this profile. Please try again.",
          );
        } finally {
          if (isMounted.current) {
            if (isInitialRender) setIsInitialRender(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      })();
  }, [dispatch, isMounted, isInitialRender, shouldRefresh, profile.profileId]);

  const handleRefresh = () => {
    if (!isInitialRender && !shouldRefresh) setShouldRefresh(true);
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
        renderItem={({ item }) => <ProfileListItem profileId={item} />}
      />
    </SafeAreaView>
  );
}
