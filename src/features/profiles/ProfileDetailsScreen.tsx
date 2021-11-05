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

import PostMasonryList from 'src/features/posts/PostMasonryList';
import { color, font, layout } from 'src/constants';
import { SOMETHING_WENT_WRONG } from 'src/constants/strings';
import { DEFAULT_ACTIVE_OPACITY } from 'src/constants/values';
import { HEADER_MAX_HEIGHT } from 'src/features/profiles/ProfileHeader';
import { useAppDispatch, useAppSelector, useIsMounted } from 'src/hooks';
import { Profile } from 'src/models';
import { RootStackScreenProps } from 'src/navigation';
import { alertUnavailableFeature } from 'src/utilities';

import {
  ActionBottomSheet,
  ActionBottomSheetItem,
  AsyncGate,
  EmptyContainer,
  LoadingContainer,
  RouteError,
} from 'src/components';

import {
  fetchPostsForProfile,
  selectPostsByProfile,
} from 'src/features/posts/posts-slice';

import PersonalProfileHeader from './personal/PersonalProfileHeader';
import VendorProfileHeader from './vendor/VendorProfileHeader';
import { fetchProfileById } from './profiles-slice';
import { useIsMyProfile, useProfile } from './hooks';

type ProfileDetailsScreenProps = RootStackScreenProps<'ProfileDetails'>;

export default function ProfileDetailsScreen(props: ProfileDetailsScreenProps) {
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
        return <LoadedProfileDetailsScreen profile={profile} />;
      }}
      onRejected={renderRouteError}
    />
  );
}

function LoadedProfileDetailsScreen(props: { profile: Profile }) {
  const $FUNC = '[LoadedProfileDetailsScreen]';
  const profile = props.profile;

  const dispatch = useAppDispatch();
  const navigation = useNavigation<ProfileDetailsScreenProps['navigation']>();
  const isMounted = useIsMounted();

  const [isInitialRender, setIsInitialRender] = useState(true);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const isMyProfile = useIsMyProfile(profile.profileId);
  const posts = useAppSelector(s => selectPostsByProfile(s, profile.profileId));
  const postIds = posts.map(post => post.id);

  const actionBottomSheetRef = useRef<BottomSheet>(null);
  const actionBottomSheetItems = useMemo(() => {
    const items: ActionBottomSheetItem[] = [];

    if (!isMyProfile) {
      const displayName = (() => {
        if (profile.kind === 'vendor') {
          return profile.businessName || profile.displayName;
        } else {
          return profile.displayName;
        }
      })();

      items.push(
        {
          id: 'block',
          label: `Block ${displayName}`,
          iconName: 'hand-right-outline',
          destructive: true,
        },
        {
          id: 'report',
          label: `Report ${profile.displayName}`,
          iconName: 'flag-outline',
        },
      );
    }

    return [
      ...items,
      { id: 'share', label: 'Share Profile', iconName: 'share-social-outline' },
    ];
  }, [isMyProfile, profile]);

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
          console.log(
            $FUNC,
            `Refreshing profile with ID '${profile.profileId}'...`,
          );

          const fetchProfileAction = fetchProfileById({
            profileId: profile.profileId,
            reload: true,
          });

          const fetchPostsAction = fetchPostsForProfile({
            profileId: profile.profileId,
            reload: true,
          });

          await Promise.all([
            dispatch(fetchProfileAction).unwrap(),
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
  }, [dispatch, isInitialRender, isMounted, shouldRefresh, profile.profileId]);

  // const handleRefresh = () => {
  //   if (!shouldRefresh) setShouldRefresh(true);
  // };

  const handleSelectActionItem = (selectedItemId: string) => {
    switch (selectedItemId) {
      case 'block':
        alertUnavailableFeature({
          title: "We're still working on this",
          message:
            'In the meantime, you may report this profile. Your report will be anonymous.',
        });
        break;
      case 'report':
        navigation.navigate('ReportItem', {
          screen: 'ReportItemReason',
          params: { type: 'profile' },
        });
        break;
      default:
        actionBottomSheetRef.current?.close();
        break;
    }
  };

  // TODO: Add pull to refresh
  return (
    <>
      <Tabs.Container
        lazy
        snapThreshold={0.25}
        headerHeight={HEADER_MAX_HEIGHT}
        containerStyle={{ backgroundColor: color.gray100 }}
        HeaderComponent={() =>
          profile.kind === 'personal' ? (
            <PersonalProfileHeader personalProfile={profile} />
          ) : (
            <VendorProfileHeader vendorProfile={profile} />
          )
        }
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
                containerStyle={profileDetailsScreenStyles.emptyContainer}
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
              containerStyle={profileDetailsScreenStyles.emptyContainer}
            />
          </Tabs.ScrollView>
        </Tabs.Tab>
      </Tabs.Container>
      <ActionBottomSheet
        ref={actionBottomSheetRef}
        items={actionBottomSheetItems}
        onSelectItem={handleSelectActionItem}
      />
    </>
  );
}

const profileDetailsScreenStyles = StyleSheet.create({
  emptyContainer: {
    paddingTop: layout.spacing.huge,
  },
});
