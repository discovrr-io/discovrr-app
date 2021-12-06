import * as React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

import * as constants from 'src/constants';
import { FeedTopTabParamList } from 'src/navigation';
import { useExtendedTheme } from 'src/hooks';

import DiscoverFeed from './DiscoverFeed';
// import NearMeFeed from './NearMeFeed';
import FollowingFeed from './FollowingFeed';
import ProductsFeed from './ProductsFeed';

const FeedTopTab = createMaterialTopTabNavigator<FeedTopTabParamList>();

export default function FeedNavigator() {
  const { colors } = useExtendedTheme();
  return (
    <FeedTopTab.Navigator
      initialRouteName="DiscoverFeed"
      screenOptions={{
        lazy: true,
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: constants.font.defaultTopTabBarLabelStyle,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.caption,
        tabBarPressColor: colors.highlight,
      }}>
      <FeedTopTab.Screen
        name="DiscoverFeed"
        component={DiscoverFeed}
        options={{ title: 'Discover' }}
      />
      {/* <FeedTopTab.Screen
        name="NearMeFeed"
        component={NearMeFeed}
        options={{ title: 'Near Me' }}
      /> */}
      <FeedTopTab.Screen
        name="ProductsFeed"
        component={ProductsFeed}
        options={{ title: 'Products' }}
      />
      <FeedTopTab.Screen
        name="FollowingFeed"
        component={FollowingFeed}
        options={{ title: 'Following' }}
      />
    </FeedTopTab.Navigator>
  );
}
