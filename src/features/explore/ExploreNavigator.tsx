import * as React from 'react';

import {
  CardStyleInterpolators,
  createStackNavigator,
  HeaderStyleInterpolators,
} from '@react-navigation/stack';

import FeedNavigator from 'src/features/feed/FeedNavigator';
import SearchNavigator from 'src/features/search/SearchNavigator';

import * as constants from 'src/constants';
import { HeaderIcon } from 'src/components';
import { useExtendedTheme } from 'src/hooks';

import {
  ExploreStackNavigationProp,
  ExploreStackParamList,
  FacadeBottomTabNavigationProp,
  MainDrawerNavigationProp,
} from 'src/navigation';

const ExploreStack = createStackNavigator<ExploreStackParamList>();

export default function ExploreNavigator() {
  const { colors } = useExtendedTheme();
  return (
    <ExploreStack.Navigator
      initialRouteName="Feed"
      screenOptions={{
        headerTintColor: colors.text,
        headerBackTitleVisible: false,
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
        headerStyleInterpolator: HeaderStyleInterpolators.forFade,
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
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
            paddingLeft: constants.layout.defaultScreenMargins.horizontal,
          },
          headerRightContainerStyle: {
            paddingRight: constants.layout.defaultScreenMargins.horizontal,
          },
        })}
      />
      <ExploreStack.Screen
        name="Search"
        component={SearchNavigator}
        options={{ headerShown: false }}
      />
    </ExploreStack.Navigator>
  );
}
