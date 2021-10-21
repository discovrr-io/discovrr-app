import React from 'react';

import {
  CardStyleInterpolators,
  createStackNavigator,
  HeaderStyleInterpolators,
} from '@react-navigation/stack';

import FeedNavigator from 'src/features/feed/FeedNavigator';
import SearchNavigator from 'src/features/search/SearchNavigator';

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
      screenOptions={{
        headerTintColor: color.black,
        headerBackTitleVisible: false,
        headerTitleStyle: font.defaultHeaderTitleStyle,
        headerStyle: { backgroundColor: color.white },
      }}>
      <ExploreStack.Screen
        name="Feed"
        component={FeedNavigator}
        options={({
          navigation,
        }: {
          navigation: ExploreStackNavigationProp;
        }) => ({
          title: 'Explore',
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
          },
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
              onPress={() =>
                navigation.navigate('Search', { screen: 'SearchQuery' })
              }
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
          headerShown: false,
          headerStyleInterpolator: HeaderStyleInterpolators.forFade,
          cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
          // gestureEnabled: false,
        }}
      />
    </ExploreStack.Navigator>
  );
}
