import React from 'react';
import { InfoContainer } from 'src/components';
import {
  FacadeBottomTabNavigationProp,
  HomeStackScreenProps,
} from 'src/navigation';

type MastheadScreenProps = HomeStackScreenProps<'Masthead'>;

export default function MastheadScreen(props: MastheadScreenProps) {
  const handleNavigateToFeed = () => {
    props.navigation
      .getParent<FacadeBottomTabNavigationProp>()
      .navigate('Feed', { screen: 'Discover' });
  };

  return (
    <InfoContainer
      emoji="🎁"
      title="No peeking!"
      message="We're in the middle of curating a whole new experience for you. In the meantime, why not check out what everyone else is up to?"
      actionTitle="Show Me"
      actionButtonType="primary"
      actionOnPress={handleNavigateToFeed}
    />
  );
}
