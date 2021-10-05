import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { HomeStackParamList } from 'src/navigation';
import { PlaceholderScreen } from 'src/components';

import MastheadScreen from './MastheadScreen';

const HomeStack = createStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Masthead" component={MastheadScreen} />
      <HomeStack.Screen name="Filter" component={PlaceholderScreen} />
    </HomeStack.Navigator>
  );
}
