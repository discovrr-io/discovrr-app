import * as React from 'react';
import { FlatList, RefreshControl, SafeAreaView, View } from 'react-native';

import { useNavigation } from '@react-navigation/core';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { useAppDispatch, useIsMounted } from 'src/hooks';
import { Profile } from 'src/models';
import { ProfileStackParamList, RootStackScreenProps } from 'src/navigation';

import {
  AsyncGate,
  EmptyContainer,
  LoadingContainer,
  RouteError,
} from 'src/components';

import ProfileListItem from './ProfileListItem';
import { useIsMyProfile, useProfile } from './hooks';
import { fetchProfileById } from './profiles-slice';

type ProfileFollowActivityScreenProps =
  RootStackScreenProps<'ProfileFollowActivity'>;

export default function ProfileFollowActivityScreen(
  props: ProfileFollowActivityScreenProps,
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
      onRejected={() => <RouteError />}
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
  const navigation =
    useNavigation<ProfileFollowActivityScreenProps['navigation']>();

  const data = React.useMemo(() => {
    return (selector === 'followers' ? profile.followers : profile.following)
      .slice()
      .reverse();
  }, [profile.followers, profile.following, selector]);

  const selectorTitle = React.useMemo(() => {
    return selector === 'followers' ? 'Followers' : 'Following';
  }, [selector]);

  const isMyProfile = useIsMyProfile(profile.profileId);
  const isMounted = useIsMounted();

  const [isInitialRender, setIsInitialRender] = React.useState(true);
  const [shouldRefresh, setShouldRefresh] = React.useState(false);

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: `${profile.__publicName} - ${selectorTitle}`,
    });
  }, [navigation, profile.__publicName, selectorTitle]);

  React.useEffect(() => {
    if (isInitialRender || shouldRefresh)
      (async () => {
        try {
          await dispatch(
            fetchProfileById({ profileId: profile.profileId, reload: true }),
          ).unwrap();
        } catch (error) {
          console.error($FUNC, 'Failed to refresh profile:', error);
          utilities.alertSomethingWentWrong(
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
            tintColor={constants.color.gray500}
            refreshing={!isInitialRender && shouldRefresh}
            onRefresh={handleRefresh}
          />
        }
        ItemSeparatorComponent={() => (
          <View
            style={{
              marginHorizontal: constants.layout.spacing.md,
              borderBottomWidth: constants.layout.border.thin,
              borderColor: constants.color.gray100,
            }}
          />
        )}
        ListEmptyComponent={() => (
          <EmptyContainer
            message={`${
              isMyProfile
                ? "You aren't"
                : (profile.__publicName || 'This user') + " isn't"
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
