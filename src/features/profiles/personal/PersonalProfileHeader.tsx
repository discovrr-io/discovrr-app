import React from 'react';

import { useNavigation } from '@react-navigation/native';

import { Button, Spacer, ToggleButton } from 'src/components';
import { color } from 'src/constants';
import { selectCurrentUserProfileId } from 'src/features/authentication/auth-slice';
import { selectPostsByProfile } from 'src/features/posts/posts-slice';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { PersonalProfile } from 'src/models/profile';
import { RootStackNavigationProp } from 'src/navigation';
import {
  alertSomethingWentWrong,
  alertUnavailableFeature,
} from 'src/utilities';

import {
  updateProfileFollowStatus,
  selectIsUserFollowingProfile,
  selectProfileById,
} from 'src/features/profiles/profiles-slice';

import ProfileHeader from '../ProfileHeader';

type UserProfileHeaderProps = {
  personalProfile: PersonalProfile;
};

export default function UserProfileHeader(props: UserProfileHeaderProps) {
  const $FUNC = '[UserProfileHeader]';
  const { personalProfile } = props;

  const dispatch = useAppDispatch();
  const navigation = useNavigation<RootStackNavigationProp>();

  const currentUserProfileId = useAppSelector(selectCurrentUserProfileId);
  const isMyProfile = personalProfile.profileId === currentUserProfileId;

  const isFollowing = useAppSelector(state => {
    return selectIsUserFollowingProfile(state, personalProfile.id);
  });

  const isFollowed = useAppSelector(state => {
    if (!currentUserProfileId) return false;
    const myProfile = selectProfileById(state, currentUserProfileId);
    return (
      myProfile?.followers?.some(id => id === personalProfile.profileId) ??
      false
    );
  });

  const totalLikes = useAppSelector(state => {
    return selectPostsByProfile(state, personalProfile.profileId)
      .map(post => post.statistics?.totalLikes ?? 0)
      .reduce((acc, curr) => acc + curr, 0);
  });

  const handleNavigateToFollowActivity = (
    selector: 'followers' | 'following',
  ) => {
    navigation.push('ProfileFollowActivity', {
      profileId: personalProfile.profileId,
      profileDisplayName: personalProfile.displayName,
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

      const updateProfileFollowStatusAction = updateProfileFollowStatus({
        didFollow,
        followeeId: personalProfile.profileId,
        followerId: currentUserProfileId,
      });

      await dispatch(updateProfileFollowStatusAction).unwrap();
      console.log($FUNC, `Successfully ${description}ed profile`);
    } catch (error) {
      console.error($FUNC, `Failed to ${description} user:`, error);
      alertSomethingWentWrong();
      throw error; // Rethrow the error to toggle the button back
    }
  };

  return (
    <ProfileHeader
      profileDetails={{
        ...personalProfile,
        displayName: personalProfile.displayName,
      }}
      renderStatistics={() => (
        <>
          <ProfileHeader.Statistic
            label="Followers"
            count={personalProfile.followers?.length ?? 0}
            onPress={() => handleNavigateToFollowActivity('followers')}
          />
          <ProfileHeader.Statistic
            label="Following"
            count={personalProfile.following?.length ?? 0}
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
                type="primary"
                size="small"
                initialState={isFollowing}
                title={isToggled =>
                  isToggled
                    ? 'Following'
                    : isFollowed
                    ? 'Follow Back'
                    : 'Follow'
                }
                underlayColor={isToggled =>
                  isToggled ? color.accentFocused : color.gray700
                }
                loadingIndicatorColor={_ => color.white}
                containerStyle={isToggled =>
                  isToggled
                    ? { width: '50%' }
                    : { borderColor: color.white, width: '50%' }
                }
                textStyle={isToggled =>
                  isToggled ? {} : { color: color.white }
                }
                onPress={handlePressFollow}
              />
              <Spacer.Horizontal value="sm" />
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
