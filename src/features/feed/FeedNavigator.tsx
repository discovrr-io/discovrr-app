import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import { color, font } from 'src/constants';
import { FeedTopTabParamList } from 'src/navigation';

import DiscoverFeed from './DiscoverFeed';
// import DiscoverFeed from './DiscoverFeed.new';
import NearMeFeed from './NearMeFeed';
import FollowingFeed from './FollowingFeed';

const FeedTopTab = createMaterialTopTabNavigator<FeedTopTabParamList>();

export default function FeedNavigator() {
  return (
    <FeedTopTab.Navigator
      initialRouteName="DiscoverFeed"
      screenOptions={{
        lazy: true,
        tabBarLabelStyle: font.defaultTabBarLabelStyle,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.gray500,
        tabBarPressColor: color.gray200,
      }}
      sceneContainerStyle={{
        backgroundColor: color.gray100,
      }}>
      <FeedTopTab.Screen
        name="DiscoverFeed"
        component={DiscoverFeed}
        options={{ title: 'Discover' }}
      />
      <FeedTopTab.Screen
        name="NearMeFeed"
        component={NearMeFeed}
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
