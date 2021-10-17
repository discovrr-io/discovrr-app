import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { PlaceholderScreen } from 'src/components';
import { SearchStackParamList } from 'src/navigation';

import SearchResults from './SearchResults';

const SearchStack = createStackNavigator<SearchStackParamList>();

export default function SearchNavigator() {
  return (
    <SearchStack.Navigator
      initialRouteName="Query"
      screenOptions={{ headerShown: false }}>
      <SearchStack.Screen name="Query" component={PlaceholderScreen} />
      <SearchStack.Screen name="Results" component={SearchResults} />
    </SearchStack.Navigator>
  );
}
