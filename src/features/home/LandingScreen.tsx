import React from 'react';
import { InfoContainer } from 'src/components';
import {
  FacadeBottomTabNavigationProp,
  HomeStackScreenProps,
} from 'src/navigation';

type MastheadScreenProps = HomeStackScreenProps<'Landing'>;

export default function LandingScreen(props: MastheadScreenProps) {
  const handleNavigateToFeed = () => {
    props.navigation
      .getParent<FacadeBottomTabNavigationProp>()
      .navigate('Feed', { screen: 'DiscoverFeed' });
  };

  return (
    <InfoContainer
      emoji="🙉"
      title="Did you hear?"
      message="We're in the middle of curating a whole new experience for you! In the meantime, why not check out what everyone else is up to?"
      actionTitle="Show Me"
      actionButtonType="primary"
      actionOnPress={handleNavigateToFeed}
    />
  );
}
