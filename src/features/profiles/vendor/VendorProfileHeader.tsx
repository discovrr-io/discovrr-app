import * as React from 'react';
import { useNavigation } from '@react-navigation/core';

import * as postsSlice from 'src/features/posts/posts-slice';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { VendorProfile } from 'src/models/profile';
import { RootStackNavigationProp } from 'src/navigation';

import ProfileHeader from '../ProfileHeader';

type VendorProfileHeaderProps = {
  vendorProfile: VendorProfile;
};

export default function VendorProfileHeader(props: VendorProfileHeaderProps) {
  const vendorProfile = props.vendorProfile;

  const _dispatch = useAppDispatch();
  const navigation = useNavigation<RootStackNavigationProp>();

  const totalLikes = useAppSelector(state => {
    return postsSlice
      .selectPostsByProfile(state, vendorProfile.profileId)
      .map(post => post.statistics?.totalLikes ?? 0)
      .reduce((acc, curr) => acc + curr, 0);
  });

  const handleNavigateToFollowActivity = (
    selector: 'followers' | 'following',
  ) => {
    navigation.push('ProfileFollowActivity', {
      profileId: vendorProfile.profileId,
      profileDisplayName: vendorProfile.displayName,
      selector,
    });
  };

  return (
    <ProfileHeader
      profileDetails={{
        ...vendorProfile,
        displayName: vendorProfile.businessName || vendorProfile.displayName,
      }}
      renderStatistics={() => (
        <>
          <ProfileHeader.Statistic
            label="Followers"
            count={vendorProfile.followers?.length ?? 0}
            onPress={() => handleNavigateToFollowActivity('followers')}
          />
          <ProfileHeader.Statistic
            label="Following"
            count={vendorProfile.following?.length ?? 0}
            onPress={() => handleNavigateToFollowActivity('following')}
          />
          <ProfileHeader.Statistic label="Likes" count={totalLikes} />
        </>
      )}
    />
  );
}
