import React from 'react';

import { RootStack } from 'src/navigation';

import ProfileScreenWrapper from './ProfileScreen';
import ProfileFollowActivityScreenWrappr from './ProfileFollowActivityScreen';

export default function renderProfileNavigator() {
  return (
    <RootStack.Group>
      <RootStack.Screen
        name="ProfileDetails"
        component={ProfileScreenWrapper}
        options={({ route }) => ({
          title: route.params.profileDisplayName || 'Profile',
          headerShown: !route.params.hideHeader ?? true,
        })}
      />
      <RootStack.Screen
        name="ProfileFollowActivity"
        component={ProfileFollowActivityScreenWrappr}
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
