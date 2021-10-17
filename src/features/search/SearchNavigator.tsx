import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { color, font } from 'src/constants';
import { SearchStackParamList } from 'src/navigation';

import SearchHeader from './SearchHeader';
import SearchQueryScreen from './SearchQueryScreen';
import SearchResultsNavigator from './SearchResultsNavigator';

const SearchStack = createStackNavigator<SearchStackParamList>();

export default function SearchNavigator() {
  return (
    <SearchStack.Navigator
      initialRouteName="Query"
      screenOptions={{
        headerTintColor: color.black,
        headerBackTitleVisible: false,
        headerTitleStyle: font.defaultHeaderTitleStyle,
      }}>
      <SearchStack.Screen
        name="Query"
        component={SearchQueryScreen}
        options={{
          header: SearchHeader,
        }}
      />
      <SearchStack.Screen
        name="Results"
        component={SearchResultsNavigator}
        options={{
          headerStyle: {
            elevation: 0,
            shadowOpacity: 0,
          },
        }}
      />
    </SearchStack.Navigator>
  );
}
