import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import FeedNavigator from 'src/features/feed/FeedNavigator';
import SearchNavigator from 'src/features/search/SearchNavigator';
import SearchHeader from 'src/features/search/SearchHeader';

import { color, font, layout } from 'src/constants';
import { HeaderIcon } from 'src/components';
import {
  ExploreStackNavigationProp,
  ExploreStackParamList,
  FacadeBottomTabNavigationProp,
  MainDrawerNavigationProp,
} from 'src/navigation';

const ExploreStack = createStackNavigator<ExploreStackParamList>();

export default function ExploreNavigator() {
  return (
    <ExploreStack.Navigator
      initialRouteName="Feed"
      screenOptions={({ route }) => ({
        headerTintColor: color.black,
        headerBackTitleVisible: false,
        headerTitleStyle: font.defaultHeaderTitleStyle,
        headerStyle: [
          { backgroundColor: color.white },
          route.name === 'Feed' && { elevation: 0, shadowOpacity: 0 },
        ],
      })}>
      <ExploreStack.Screen
        name="Feed"
        component={FeedNavigator}
        options={({
          navigation,
        }: {
          navigation: ExploreStackNavigationProp;
        }) => ({
          title: 'Explore',
          headerLeft: props => (
            <HeaderIcon.Menu
              {...props}
              onPress={() =>
                navigation
                  .getParent<FacadeBottomTabNavigationProp>()
                  .getParent<MainDrawerNavigationProp>()
                  .openDrawer()
              }
            />
          ),
          headerRight: props => (
            <HeaderIcon
              {...props}
              name="search"
              size={24}
              // onPress={() => navigation.navigate('SearchQuery')}
              onPress={() => navigation.navigate('Search', { screen: 'Query' })}
            />
          ),
          headerLeftContainerStyle: {
            paddingLeft: layout.defaultScreenMargins.horizontal,
          },
          headerRightContainerStyle: {
            paddingRight: layout.defaultScreenMargins.horizontal,
          },
        })}
      />
      <ExploreStack.Screen
        name="Search"
        component={SearchNavigator}
        options={{
          header: SearchHeader,
        }}
      />
    </ExploreStack.Navigator>
  );
}
