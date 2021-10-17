import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import { SearchStackParamList } from 'src/navigation';
import { PlaceholderScreen } from 'src/components';

const SearchStack = createStackNavigator<SearchStackParamList>();

export default function SearchNavigator() {
  return (
    <SearchStack.Navigator>
      <SearchStack.Screen name="Search" component={PlaceholderScreen} />
      <SearchStack.Screen name="Results" component={PlaceholderScreen} />
    </SearchStack.Navigator>
  );
}
