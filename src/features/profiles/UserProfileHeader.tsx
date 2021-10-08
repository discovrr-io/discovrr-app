import React from 'react';
import { Alert, View } from 'react-native';

import { useNavigation } from '@react-navigation/native';

import { Button, ToggleButton } from 'src/components';
import { color, layout } from 'src/constants';
import { SOMETHING_WENT_WRONG } from 'src/constants/strings';
import { selectCurrentUserProfileId } from 'src/features/authentication/auth-slice';
import { selectPostsByProfile } from 'src/features/posts/posts-slice';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { Profile } from 'src/models';
import { RootStackNavigationProp } from 'src/navigation';
import { alertUnavailableFeature } from 'src/utilities';

import {
  updateProfileFollowStatus,
  selectIsUserFollowingProfile,
  selectProfileById,
} from 'src/features/profiles/profiles-slice';

import ProfileHeader from './ProfileHeader';
// import { useIsMyProfile } from './hooks';

type UserProfileHeaderProps = {
  profile: Profile;
};

export default function UserProfileHeader({ profile }: UserProfileHeaderProps) {
  const $FUNC = '[UserProfileHeader]';

  const dispatch = useAppDispatch();
  const navigation = useNavigation<RootStackNavigationProp>();

  const currentUserProfileId = useAppSelector(selectCurrentUserProfileId);
  const isMyProfile = profile.id === currentUserProfileId;

  const isFollowing = useAppSelector(state =>
    selectIsUserFollowingProfile(state, profile.id),
  );

  const isFollowed = useAppSelector(state => {
    if (!currentUserProfileId) return false;
    const myProfile = selectProfileById(state, currentUserProfileId);
    return myProfile?.followers?.some(id => id === profile.id) ?? false;
  });

  const totalLikes = useAppSelector(state => {
    return selectPostsByProfile(state, profile.id)
      .map(post => post.statistics?.totalLikes ?? 0)
      .reduce((acc, curr) => acc + curr, 0);
  });

  const handleNavigateToFollowActivity = (
    selector: 'followers' | 'following',
  ) => {
    navigation.push('ProfileFollowActivity', {
      profileId: profile.id,
      profileDisplayName: profile.displayName,
      selector,
    });
  };

  const handlePressEditProfile = () => {
    navigation.navigate('ProfileSettings');
  };

  const handlePressFollow = async () => {
    const didFollow = !isFollowing;
    const description = didFollow ? 'follow' : 'unfollow';

    try {
      if (!currentUserProfileId) {
        console.warn(
          $FUNC,
          'No profile ID was found for the current user, which is unexpected.',
          'Aborting `changeProfileFollowStatus` action...',
        );
        throw new Error('Failed to find profile for the current user');
      }

      console.log($FUNC, `Will ${description} profile...`);

      const updateProfileFollowStatusAction = updateProfileFollowStatus({
        didFollow,
        followeeId: profile.id,
        followerId: currentUserProfileId,
      });

      await dispatch(updateProfileFollowStatusAction).unwrap();
      console.log($FUNC, `Successfully ${description}ed profile`);
    } catch (error) {
      console.error($FUNC, `Failed to ${description} user:`, error);
      Alert.alert(SOMETHING_WENT_WRONG.title, SOMETHING_WENT_WRONG.message);
      throw error; // Rethrow the error to toggle the button back
    }
  };

  return (
    <ProfileHeader
      profileDetails={{ ...profile, displayName: profile.displayName }}
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
      renderActions={() => (
        <>
          {isMyProfile ? (
            <Button
              size="small"
              variant="outlined"
              title="Edit Profile"
              textStyle={{ color: color.white }}
              containerStyle={{ flexGrow: 1, borderColor: color.white }}
              underlayColor={color.gray700}
              onPress={handlePressEditProfile}
            />
          ) : (
            <>
              <ToggleButton
                size="small"
                type="primary"
                initialState={isFollowing}
                titles={{
                  on: 'Following',
                  off: isFollowed ? 'Follow Back' : 'Follow',
                }}
                onStateUnderlayColor={color.accentFocused}
                offStateUnderlayColor={color.gray700}
                onStateLoadingIndicatorColor={color.white}
                offStateLoadingIndicatorColor={color.white}
                offStateStyle={{ borderColor: color.white }}
                offStateTextStyle={{ color: color.white }}
                containerStyle={{ width: '50%' }}
                onPress={handlePressFollow}
              />
              <View style={{ width: layout.spacing.sm * 1.5 }} />
              <Button
                size="small"
                variant="outlined"
                title="Message"
                textStyle={{ color: color.white }}
                containerStyle={{ flexGrow: 1, borderColor: color.white }}
                underlayColor={color.gray700}
                onPress={() => alertUnavailableFeature()}
              />
            </>
          )}
        </>
      )}
    />
  );
}
