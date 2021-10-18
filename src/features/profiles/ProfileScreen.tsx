import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import BottomSheet from '@gorhom/bottom-sheet';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/core';
import { Tabs, MaterialTabBar } from 'react-native-collapsible-tab-view';

import { color, font, layout } from 'src/constants';
import { SOMETHING_WENT_WRONG } from 'src/constants/strings';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';
import { HEADER_MAX_HEIGHT } from 'src/features/profiles/ProfileHeader';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { Profile } from 'src/models';
import { ProfileStackScreenProps } from 'src/navigation';

import UserProfileHeader from './UserProfileHeader';
import { fetchProfileById } from './profiles-slice';
import { useIsMyProfile, useProfile } from './hooks';

import {
  fetchPostsForProfile,
  selectPostsByProfile,
} from 'src/features/posts/posts-slice';

import {
  ActionBottomSheet,
  AsyncGate,
  EmptyContainer,
  LoadingContainer,
  PostMasonryList,
  RouteError,
} from 'src/components';
import { ActionBottomSheetItem } from 'src/components/bottom-sheets/ActionBottomSheet';

type ProfileScreenProps = ProfileStackScreenProps<'ProfileDetails'>;

export default function ProfileScreen(props: ProfileScreenProps) {
  const { profileId } = props.route.params;
  const profileData = useProfile(profileId);

  const renderRouteError = (_error?: any) => (
    <RouteError containerStyle={{ backgroundColor: color.white }} />
  );

  return (
    <AsyncGate
      data={profileData}
      onPending={() => (
        <SafeAreaView style={{ flexGrow: 1, justifyContent: 'center' }}>
          <LoadingContainer message="Loading profile..." />
        </SafeAreaView>
      )}
      onFulfilled={profile => {
        if (!profile) return renderRouteError();
        return <LoadedProfileScreen profile={profile} />;
      }}
      onRejected={renderRouteError}
    />
  );
}

function LoadedProfileScreen(props: { profile: Profile }) {
  const $FUNC = '[UserProfileScreen]';
  const { profile } = props;

  const dispatch = useAppDispatch();
  const navigation = useNavigation<ProfileScreenProps['navigation']>();
  const isMounted = useIsMounted();

  const [isInitialRender, setIsInitialRender] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const isMyProfile = useIsMyProfile(profile.id);
  const posts = useAppSelector(s => selectPostsByProfile(s, profile.id));
  const postIds = posts.map(post => post.id);

  const actionBottomSheetRef = useRef<BottomSheet>(null);
  const actionBottomSheetItems = useMemo(() => {
    const items: ActionBottomSheetItem[] = [];

    if (!isMyProfile) {
      items.push(
        {
          label: `Block ${profile.displayName}`,
          iconName: 'hand-right-outline',
          destructive: true,
        },
        { label: `Report ${profile.displayName}`, iconName: 'flag-outline' },
      );
    }

    return [
      ...items,
      { label: 'Share Profile', iconName: 'share-social-outline' },
    ];
  }, [isMyProfile, profile.displayName]);

  useLayoutEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/display-name
      headerRight: () => (
        <TouchableOpacity
          activeOpacity={DEFAULT_ACTIVE_OPACITY}
          onPress={() => actionBottomSheetRef.current?.expand()}
          style={{ marginRight: layout.defaultScreenMargins.horizontal }}>
          <Icon
            name={Platform.select({
              android: 'ellipsis-vertical',
              default: 'ellipsis-horizontal',
            })}
            size={24}
            color={color.black}
          />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  useEffect(() => {
    if (isInitialRender || shouldRefresh)
      (async () => {
        try {
          console.log($FUNC, `Refreshing profile with ID '${profile.id}'...`);

          const fetchProfileAction = fetchProfileById({
            profileId: profile.id,
            reload: true,
          });

          const fetchPostsAction = fetchPostsForProfile({
            profileId: profile.id,
            reload: true,
          });

          await Promise.all([
            dispatch(fetchProfileAction),
            dispatch(fetchPostsAction).unwrap(),
          ]);
        } catch (error) {
          console.error($FUNC, 'Failed to refresh profile:', error);
          Alert.alert(
            SOMETHING_WENT_WRONG.title,
            "We weren't able to refresh this profile for you. Please try again later.",
          );
        } finally {
          if (isMounted.current) {
            if (isInitialRender) setIsInitialRender(false);
            if (shouldRefresh) setShouldRefresh(false);
          }
        }
      })();
  }, [dispatch, isInitialRender, isMounted, shouldRefresh, profile.id]);

  // const handleRefresh = () => {
  //   if (!shouldRefresh) setShouldRefresh(true);
  // };

  // TODO: Add pull to refresh
  return (
    <>
      <Tabs.Container
        lazy
        snapThreshold={0.25}
        headerHeight={HEADER_MAX_HEIGHT}
        containerStyle={{ backgroundColor: color.gray100 }}
        HeaderComponent={() => <UserProfileHeader profile={profile} />}
        TabBarComponent={props => (
          <MaterialTabBar
            {...props}
            activeColor={color.black}
            inactiveColor={color.gray700}
            labelStyle={font.medium}
            indicatorStyle={{ backgroundColor: color.accent }}
            contentContainerStyle={{ backgroundColor: color.white }}
          />
        )}>
        <Tabs.Tab name="posts" label="Posts">
          <PostMasonryList
            smallContent
            postIds={postIds}
            // @ts-ignore
            ScrollViewComponent={Tabs.ScrollView}
            ListEmptyComponent={
              <EmptyContainer
                justifyContentToCenter={false}
                message={`${
                  isMyProfile
                    ? "You haven't"
                    : (profile.displayName || 'This user') + " hasn't"
                } posted anything yet.`}
                containerStyle={userProfileScreenStyles.emptyContainer}
              />
            }
          />
        </Tabs.Tab>
        <Tabs.Tab name="notes" label="Notes">
          {/* @ts-ignore */}
          <Tabs.ScrollView>
            <EmptyContainer
              justifyContentToCenter={false}
              message={`${
                isMyProfile
                  ? "You haven't"
                  : (profile.displayName || 'This user') + " hasn't"
              } shared any public notes.`}
              containerStyle={userProfileScreenStyles.emptyContainer}
            />
          </Tabs.ScrollView>
        </Tabs.Tab>
      </Tabs.Container>
      <ActionBottomSheet
        ref={actionBottomSheetRef}
        items={actionBottomSheetItems}
      />
    </>
  );
}

const userProfileScreenStyles = StyleSheet.create({
  emptyContainer: {
    paddingTop: layout.spacing.huge,
  },
});
