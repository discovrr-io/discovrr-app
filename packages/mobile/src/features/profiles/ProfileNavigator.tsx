import * as React from 'react';

import { color, layout } from 'src/constants';
import { useExtendedTheme } from 'src/hooks';
import { RootStack } from 'src/navigation';

import ProfileDetailsScreen from './ProfileDetailsScreen';
import ProfileFollowActivityScreen from './ProfileFollowActivityScreen';

export default function renderProfileNavigator() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { colors } = useExtendedTheme();

  return (
    <RootStack.Group
      screenOptions={{
        headerTitleContainerStyle: layout.narrowHeaderTitleContainerStyle,
      }}>
      <RootStack.Screen
        name="ProfileDetails"
        component={ProfileDetailsScreen}
        options={{
          title: 'Profile',
          headerTransparent: true,
          headerTintColor: color.absoluteWhite,
          headerShown: false, // Don't show the header while profile is loading
        }}
      />
      <RootStack.Screen
        name="ProfileFollowActivity"
        component={ProfileFollowActivityScreen}
        options={({ route }) => ({
          title:
            route.params.selector === 'followers' ? 'Followers' : 'Following',
          cardStyle: { backgroundColor: colors.card },
        })}
      />
    </RootStack.Group>
  );
}
