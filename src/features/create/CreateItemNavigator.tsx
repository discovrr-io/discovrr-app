import React from 'react';
import { useWindowDimensions } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CreateTextPostScreen from './CreateTextPostScreen';
import CreateItemPreviewScreen from './CreateItemPreviewScreen';
import { HeaderIcon, PlaceholderScreen } from 'src/components';
import { color, font, layout } from 'src/constants';

import {
  CreateItemDetailsTopTabParamList,
  CreateItemStackParamList,
} from 'src/navigation';

const TAB_ICON_SIZE = 24;

const __IS_VENDOR = true;
const __TAB_COUNT = __IS_VENDOR ? 5 : 3;

type TabBarIconProps = {
  name: string;
  focused: boolean;
  color: string;
  size?: number;
};

const TabBarIcon = (props: TabBarIconProps) => (
  <Icon
    name={props.name}
    color={props.focused ? props.color : color.gray500}
    size={props.size ?? TAB_ICON_SIZE}
  />
);

const CreateItemStack = createStackNavigator<CreateItemStackParamList>();
const CreateItemDetailsTopTab =
  createMaterialTopTabNavigator<CreateItemDetailsTopTabParamList>();

function CreateItemDetailsNavigator() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  return (
    <CreateItemDetailsTopTab.Navigator
      initialRouteName="CreateTextPost"
      tabBarPosition="bottom"
      screenOptions={{
        tabBarShowIcon: true,
        tabBarScrollEnabled: true,
        tabBarLabelStyle: {
          ...font.defaultTabBarLabelStyle,
          fontSize: font.size.sm,
        },
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.gray500,
        tabBarPressColor: color.gray200,
        tabBarItemStyle: {
          width: screenWidth / __TAB_COUNT,
          // paddingVertical: layout.spacing.md,
          paddingHorizontal: 0,
        },
        tabBarContentContainerStyle: {
          paddingBottom: insets.bottom,
        },
        tabBarIndicatorStyle: {
          top: 0,
        },
      }}>
      <CreateItemDetailsTopTab.Screen
        name="CreateTextPost"
        component={CreateTextPostScreen}
        options={{
          title: 'Text',
          tabBarIcon: props => <TabBarIcon name="text-outline" {...props} />,
        }}
      />
      <CreateItemDetailsTopTab.Screen
        name="CreateGalleryPost"
        component={PlaceholderScreen}
        options={{
          title: 'Gallery',
          tabBarIcon: props => <TabBarIcon name="images-outline" {...props} />,
        }}
      />
      <CreateItemDetailsTopTab.Screen
        name="CreateVideoPost"
        component={PlaceholderScreen}
        options={{
          title: 'Video',
          tabBarIcon: props => <TabBarIcon name="film-outline" {...props} />,
        }}
      />
      {__IS_VENDOR && (
        <CreateItemDetailsTopTab.Screen
          name="CreateProduct"
          component={PlaceholderScreen}
          options={{
            title: 'Product',
            tabBarIcon: props => <TabBarIcon name="gift-outline" {...props} />,
          }}
        />
      )}
      {__IS_VENDOR && (
        <CreateItemDetailsTopTab.Screen
          name="CreateWorkshop"
          component={PlaceholderScreen}
          options={{
            title: 'Workshop',
            tabBarIcon: props => <TabBarIcon name="brush-outline" {...props} />,
          }}
        />
      )}
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
