import React from 'react';

import { createStackNavigator } from '@react-navigation/stack';

import { HomeStackParamList } from 'src/navigation';
import { PlaceholderScreen } from 'src/components';

import LandingScreen from './LandingScreen';

const HomeStack = createStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="Landing" component={LandingScreen} />
      <HomeStack.Screen name="Filter" component={PlaceholderScreen} />
    </HomeStack.Navigator>
  );
}
