import React from 'react';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import CreateTextScreen from './CreateTextScreen';
import { HeaderIcon, PlaceholderScreen } from 'src/components';
import { color, font, layout } from 'src/constants';

import {
  CreateItemDetailsTopTabParamList,
  CreateItemStackParamList,
} from 'src/navigation';

const CreateItemStack = createStackNavigator<CreateItemStackParamList>();
const CreateItemDetailsTopTab =
  createMaterialTopTabNavigator<CreateItemDetailsTopTabParamList>();

function CreateItemDetailsNavigator() {
  return (
    <CreateItemDetailsTopTab.Navigator
      initialRouteName="CreateText"
      tabBarPosition="bottom"
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarLabelStyle: font.defaultTabBarLabelStyle,
      }}>
      <CreateItemDetailsTopTab.Screen
        name="CreateText"
        component={CreateTextScreen}
        options={{ title: 'Text' }}
      />
      <CreateItemDetailsTopTab.Screen
        name="CreateGallery"
        component={PlaceholderScreen}
        options={{ title: 'Gallery' }}
      />
      <CreateItemDetailsTopTab.Screen
        name="CreateVideo"
        component={PlaceholderScreen}
        options={{ title: 'Video' }}
      />
    </CreateItemDetailsTopTab.Navigator>
  );
}

export default function CreateNavigator() {
  return (
    <CreateItemStack.Navigator
      initialRouteName="CreateItemDetails"
      screenOptions={{
        headerLeft: props => <HeaderIcon.Close {...props} />,
        headerLeftContainerStyle: {
          paddingLeft: layout.defaultScreenMargins.horizontal,
        },
      }}>
      <CreateItemStack.Screen
        name="CreateItemDetails"
        component={CreateItemDetailsNavigator}
        options={{
          title: 'New Post',
          headerTintColor: color.black,
          headerBackTitleVisible: false,
          headerTitleStyle: font.defaultHeaderTitleStyle,
        }}
      />
      <CreateItemStack.Screen
        name="CreateItemPreview"
        component={PlaceholderScreen}
      />
    </CreateItemStack.Navigator>
  );
}
