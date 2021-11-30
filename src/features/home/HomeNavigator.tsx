import React from 'react';

import {
  CardStyleInterpolators,
  createStackNavigator,
  HeaderStyleInterpolators,
} from '@react-navigation/stack';

import * as constants from 'src/constants';
import LandingScreen from './LandingScreen';
import SearchNavigator from 'src/features/search/SearchNavigator';
import { HeaderIcon, PlaceholderScreen } from 'src/components';
import { useExtendedTheme } from 'src/hooks';
import {
  FacadeBottomTabNavigationProp,
  HomeStackNavigationProp,
  HomeStackParamList,
  MainDrawerNavigationProp,
} from 'src/navigation';

const HomeStack = createStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  const { colors } = useExtendedTheme();
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerTintColor: colors.text,
        headerBackTitleVisible: false,
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
        headerStyleInterpolator: HeaderStyleInterpolators.forFade,
        cardStyleInterpolator: CardStyleInterpolators.forFadeFromCenter,
      }}>
      <HomeStack.Screen
        name="Landing"
        component={LandingScreen}
        options={({ navigation }: { navigation: HomeStackNavigationProp }) => ({
          title: 'Home',
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
                navigation.navigate('__Search', { screen: 'SearchQuery' })
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
      <HomeStack.Screen name="Filter" component={PlaceholderScreen} />
      {/* -- TEMPORARY -- */}
      <HomeStack.Screen
        name="__Search"
        component={SearchNavigator}
        options={{ headerShown: false }}
      />
    </HomeStack.Navigator>
  );
}
