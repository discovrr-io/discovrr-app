import * as React from 'react';

import { useNavigation } from '@react-navigation/native';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import ProfileHeader from 'src/features/profiles/ProfileHeader';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { Profile } from 'src/models';
import { RootStackNavigationProp } from 'src/navigation';

import { Button, ToggleButton } from 'src/components';

import * as authSlice from 'src/features/authentication/auth-slice';
import * as postsSlice from 'src/features/posts/posts-slice';
import * as profilesSlice from './profiles-slice';

type DefaultProfileHeaderProps = {
  profile: Profile;
};

export default function DefaultProfileHeader(props: DefaultProfileHeaderProps) {
  const $FUNC = '[DefaultProfileHeader]';
  const profile = props.profile;

  const dispatch = useAppDispatch();
  const navigation = useNavigation<RootStackNavigationProp>();

  const currentUserProfileId = useAppSelector(
    authSlice.selectCurrentUserProfileId,
  );

  const isMyProfile = profile.profileId === currentUserProfileId;

  const isFollowing = useAppSelector(state => {
    return profilesSlice.selectIsUserFollowingProfile(state, profile.id);
  });

  const isFollowed = useAppSelector(state => {
    if (!currentUserProfileId) return false;
    const myProfile = profilesSlice.selectProfileById(
      state,
      currentUserProfileId,
    );
    return myProfile?.followers?.some(id => id === profile.profileId) ?? false;
  });

  const totalLikes = useAppSelector(state => {
    return postsSlice
      .selectPostsByProfile(state, profile.profileId)
      .map(post => post.statistics?.totalLikes ?? 0)
      .reduce((acc, curr) => acc + curr, 0);
  });

  const handleNavigateToFollowActivity = (
    selector: 'followers' | 'following',
  ) => {
    navigation.push('ProfileFollowActivity', {
      profileId: profile.profileId,
      profileDisplayName: profile.displayName,
      selector,
    });
  };

  const handlePressEditProfile = () => {
    navigation.navigate('ProfileSettings');
  };

  const handlePressFollow = async (didFollow: boolean) => {
    const description = didFollow ? 'follow' : 'unfollow';

    try {
      if (!currentUserProfileId) {
        console.warn(
          $FUNC,
          'No profile ID was found for the current user, which is unexpected.',
          'Aborting `updateProfileFollowStatus` action...',
        );
        throw new Error('Failed to find profile for the current user');
      }

      console.log($FUNC, `Will ${description} profile...`);

      const updateProfileFollowStatusAction =
        profilesSlice.updateProfileFollowStatus({
          didFollow,
          followeeId: profile.profileId,
          followerId: currentUserProfileId,
        });

      await dispatch(updateProfileFollowStatusAction).unwrap();
      console.log($FUNC, `Successfully ${description}ed profile`);
    } catch (error) {
      console.error($FUNC, `Failed to ${description} user:`, error);
      utilities.alertSomethingWentWrong();
      throw error; // Rethrow the error to toggle the button back
    }
  };

  return (
    <ProfileHeader
      profileDetails={{
        ...profile,
        displayName:
          profile.kind === 'vendor' && profile.businessName
            ? profile.businessName
            : profile.displayName,
      }}
      renderStatistics={() => (
        <>
          <ProfileHeader.Statistic
            label="Followers"
            count={profile.followers?.length ?? 0}
            onPress={() => handleNavigateToFollowActivity('followers')}
          />
          <ProfileHeader.Statistic
            label="Following"
            count={profile.following?.length ?? 0}
            onPress={() => handleNavigateToFollowActivity('following')}
          />
          <ProfileHeader.Statistic label="Likes" count={totalLikes} />
        </>
      )}
      renderActions={() =>
        isMyProfile ? (
          <Button
            size="small"
            variant="outlined"
            title="Edit My Profile"
            textStyle={{ color: constants.color.defaultLightTextColor }}
            underlayColor={constants.color.gray700}
            containerStyle={{
              flexGrow: 1,
              borderColor: constants.color.defaultLightTextColor,
            }}
            onPress={handlePressEditProfile}
          />
        ) : (
          <ToggleButton
            size="small"
            type="primary"
            initialState={isFollowing}
            title={isToggled =>
              isToggled ? 'Following' : isFollowed ? 'Follow Back' : 'Follow'
            }
            loadingIndicatorColor={_ => constants.color.defaultLightTextColor}
            underlayColor={isToggled =>
              isToggled
                ? constants.color.accentFocused
                : constants.color.gray700
            }
            textStyle={isToggled => [
              !isToggled && { color: constants.color.defaultLightTextColor },
            ]}
            containerStyle={isToggled => [
              { flexGrow: 1 },
              !isToggled && {
                borderColor: constants.color.defaultLightTextColor,
              },
            ]}
            onPress={handlePressFollow}
          />
        )
      }
    />
  );
}
