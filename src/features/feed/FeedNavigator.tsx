import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTheme } from '@react-navigation/native';

import { color, font } from 'src/constants';
import { FeedTopTabParamList } from 'src/navigation';

import DiscoverFeed from './DiscoverFeed';
// import DiscoverFeed from './DiscoverFeed.new';
import NearMeFeed from './NearMeFeed';
import FollowingFeed from './FollowingFeed';

const FeedTopTab = createMaterialTopTabNavigator<FeedTopTabParamList>();

export default function FeedNavigator() {
  const { dark } = useTheme();
  return (
    <FeedTopTab.Navigator
      initialRouteName="DiscoverFeed"
      screenOptions={{
        lazy: true,
        tabBarLabelStyle: font.defaultTopTabBarLabelStyle,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: dark ? color.gray300 : color.gray500,
        tabBarPressColor: dark ? color.gray700 : color.gray200,
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
