import React from 'react';
import { ScrollView, Text } from 'react-native';

import { useAppSelector } from '../../hooks';
import { selectCurrentUserProfileId } from '../authentication/authSlice';
import { selectProfileById } from './profilesSlice';

type ProfileEditScreenProps = {};

export default function ProfileEditScreen(props: ProfileEditScreenProps) {
  // TODO: This could be undefined
  const profileId = useAppSelector(selectCurrentUserProfileId);
  const profile = useAppSelector((state) =>
    selectProfileById(state, profileId),
  );

  return (
    <ScrollView>
      <Text>{JSON.stringify(profile)}</Text>
    </ScrollView>
  );
}
