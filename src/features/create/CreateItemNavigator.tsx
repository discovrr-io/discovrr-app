import React from 'react';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CreateTextScreen from './CreateTextScreen';
import CreateItemPreviewScreen from './CreateItemPreviewScreen';
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
  const insets = useSafeAreaInsets();

  return (
    <CreateItemDetailsTopTab.Navigator
      initialRouteName="CreateTextPost"
      tabBarPosition="bottom"
      screenOptions={{
        tabBarScrollEnabled: true,
        tabBarLabelStyle: font.defaultTabBarLabelStyle,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.gray500,
        tabBarPressColor: color.gray200,
        tabBarContentContainerStyle: {
          paddingBottom: insets.bottom,
        },
        tabBarIndicatorStyle: {
          top: 0,
        },
      }}>
      <CreateItemDetailsTopTab.Screen
        name="CreateTextPost"
        component={CreateTextScreen}
        options={{ title: 'Text' }}
      />
      <CreateItemDetailsTopTab.Screen
        name="CreateGalleryPost"
        component={PlaceholderScreen}
        options={{ title: 'Gallery' }}
      />
      <CreateItemDetailsTopTab.Screen
        name="CreateVideoPost"
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
      screenOptions={({ route }) => ({
        headerTintColor: color.black,
        headerBackTitleVisible: false,
        headerTitleStyle: font.defaultHeaderTitleStyle,
        headerLeft: props =>
          route.name === 'CreateItemDetails' ? (
            <HeaderIcon.Close {...props} />
          ) : (
            <HeaderIcon.Back {...props} />
          ),
        headerLeftContainerStyle: {
          paddingLeft: layout.defaultScreenMargins.horizontal,
        },
      })}>
      <CreateItemStack.Screen
        name="CreateItemDetails"
        component={CreateItemDetailsNavigator}
        options={{ title: 'New Post' }}
      />
      <CreateItemStack.Screen
        name="CreateItemPreview"
        component={CreateItemPreviewScreen}
        options={{ title: 'Preview' }}
      />
    </CreateItemStack.Navigator>
  );
}
