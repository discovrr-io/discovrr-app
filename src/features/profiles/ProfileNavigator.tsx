import * as React from 'react';
import { Platform } from 'react-native';

import { color, layout } from 'src/constants';
import { RootStack } from 'src/navigation';
import ProfileDetailsScreen from './ProfileDetailsScreen';
import ProfileFollowActivityScreen from './ProfileFollowActivityScreen';

export default function renderProfileNavigator() {
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
        })}
      />
    </RootStack.Group>
  );
}
