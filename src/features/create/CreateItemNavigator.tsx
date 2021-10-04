import React from 'react';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import TextPostScreen from './TextPostScreen';
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
      initialRouteName="Text"
      tabBarPosition="bottom"
      screenOptions={{
        tabBarLabelStyle: {
          textTransform: 'none',
          fontFamily: font.FONT_FAMILY_REGULAR,
          fontSize: font.size.md,
        },
      }}>
      <CreateItemDetailsTopTab.Screen name="Text" component={TextPostScreen} />
      <CreateItemDetailsTopTab.Screen
        name="Gallery"
        component={PlaceholderScreen}
      />
      <CreateItemDetailsTopTab.Screen
        name="Video"
        component={PlaceholderScreen}
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
