import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { color, font } from 'src/constants';
import { FeedTopTabParamList } from 'src/navigation';

import DiscoverFeed from './DiscoverFeed';
import NearMeFeed from './NearMeFeed';
import FollowingFeed from './FollowingFeed';

const FeedTopTab = createMaterialTopTabNavigator<FeedTopTabParamList>();

export default function FeedNavigator() {
  return (
    <FeedTopTab.Navigator
      initialRouteName="DiscoverFeed"
      screenOptions={{
        lazy: true,
        tabBarStyle: { backgroundColor: color.white },
        tabBarActiveTintColor: color.black,
        tabBarInactiveTintColor: color.gray500,
        tabBarPressColor: color.gray200,
        tabBarBounces: true,
        tabBarLabelStyle: {
          textTransform: 'none',
          fontFamily: font.FONT_FAMILY_REGULAR,
          fontSize: font.size.md,
        },
      }}
      sceneContainerStyle={{
        backgroundColor: color.gray100,
        // backgroundColor: color.white,
      }}>
      <FeedTopTab.Screen
        name="DiscoverFeed"
        component={DiscoverFeed}
        options={{ title: 'Discover' }}
      />
      <FeedTopTab.Screen
        name="NearMeFeed"
        component={NearMeFeed}
        // component={PlaceholderScreen}
        options={{ title: 'Near Me' }}
      />
      <FeedTopTab.Screen
        name="FollowingFeed"
        component={FollowingFeed}
        options={{ title: 'Following' }}
      />
    </FeedTopTab.Navigator>
  );
}
