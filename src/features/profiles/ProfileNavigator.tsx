import * as React from 'react';
import { color } from 'src/constants';

import { RootStack } from 'src/navigation';
import ProfileDetailsScreen from './ProfileDetailsScreen';
import ProfileFollowActivityScreen from './ProfileFollowActivityScreen';

export default function renderProfileNavigator() {
  return (
    <RootStack.Group>
      <RootStack.Screen
        name="ProfileDetails"
        component={ProfileDetailsScreen}
        options={{
          title: 'Profile',
          headerTransparent: true,
          headerTintColor: color.absoluteWhite,
        }}
      />
      <RootStack.Screen
        name="ProfileFollowActivity"
        component={ProfileFollowActivityScreen}
        options={({ route }) => {
          const { profileDisplayName, selector } = route.params;
          const selectorTitle =
            selector === 'followers' ? 'Followers' : 'Following';

          return {
            title: profileDisplayName
              ? `${profileDisplayName} - ${selectorTitle}`
              : selectorTitle,
          };
        }}
      />
    </RootStack.Group>
  );
}
