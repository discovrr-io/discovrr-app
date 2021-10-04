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
      initialRouteName="Discover"
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
      <FeedTopTab.Screen name="Discover" component={DiscoverFeed} />
      <FeedTopTab.Screen
        name="NearMe"
        component={NearMeFeed}
        options={{ title: 'Near Me' }}
      />
      <FeedTopTab.Screen name="Following" component={FollowingFeed} />
    </FeedTopTab.Navigator>
  );
}
