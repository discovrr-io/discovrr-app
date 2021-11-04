import React from 'react';
import { Platform, useWindowDimensions } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';

import * as globalSelectors from 'src/global-selectors';
import { HeaderIcon, PlaceholderScreen } from 'src/components';
import { color, font, layout } from 'src/constants';
import { useAppSelector } from 'src/hooks';

import {
  CreateItemDetailsTopTabParamList,
  CreateItemStackParamList,
} from 'src/navigation';

import CreateItemPreviewScreen from './CreateItemPreviewScreen';
import CreateTextPostScreen from './CreateTextPostScreen';
import CreateGalleryPostScreen from './CreateGalleryPostScreen';
import CreateVideoPostScreen from './CreateVideoPostScreen';
import CreateProductScreen from './CreateProductScreen';

const TAB_ICON_SIZE = 24;

type TabBarIconProps = {
  name: string;
  focused: boolean;
  color: string;
  size?: number;
};

const TabBarIcon = (props: TabBarIconProps) => (
  <Icon
    name={`${props.name}-outline`}
    // name={props.focused ? props.name : props.name + '-outline'}
    color={props.focused ? props.color : color.gray500}
    size={props.size ?? TAB_ICON_SIZE}
  />
);

const CreateItemStack = createStackNavigator<CreateItemStackParamList>();
const CreateItemDetailsTopTab =
  createMaterialTopTabNavigator<CreateItemDetailsTopTabParamList>();

function CreateItemDetailsNavigator() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const myProfileKind = useAppSelector(
    globalSelectors.selectCurrentUserProfileKind,
  );

  return (
    <CreateItemDetailsTopTab.Navigator
      initialRouteName="CreateTextPost"
      tabBarPosition="bottom"
      initialLayout={{ width: windowWidth }}
      screenOptions={{
        swipeEnabled: false,
        tabBarShowIcon: true,
        tabBarScrollEnabled: true,
        tabBarActiveTintColor: color.accent,
        tabBarInactiveTintColor: color.gray500,
        tabBarPressColor: color.gray200,
        tabBarStyle: {
          backgroundColor: color.absoluteWhite,
        },
        tabBarContentContainerStyle: {
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: {
          width: windowWidth / (myProfileKind === 'vendor' ? 5 : 3),
          paddingHorizontal: 0,
        },
        tabBarIndicatorStyle: {
          top: 0,
        },
        tabBarLabelStyle: {
          ...font.defaultTabBarLabelStyle,
          fontSize: font.size.sm,
        },
      }}>
      <CreateItemDetailsTopTab.Screen
        name="CreateTextPost"
        component={CreateTextPostScreen}
        options={{
          title: 'Text',
          tabBarIcon: props => <TabBarIcon name="text" {...props} />,
        }}
      />
      <CreateItemDetailsTopTab.Screen
        name="CreateGalleryPost"
        component={CreateGalleryPostScreen}
        options={{
          title: 'Gallery',
          tabBarIcon: props => <TabBarIcon name="images" {...props} />,
        }}
      />
      <CreateItemDetailsTopTab.Screen
        name="CreateVideoPost"
        component={CreateVideoPostScreen}
        options={{
          title: 'Video',
          tabBarIcon: props => <TabBarIcon name="film" {...props} />,
        }}
      />
      {myProfileKind === 'vendor' && (
        <>
          <CreateItemDetailsTopTab.Screen
            name="CreateProduct"
            component={CreateProductScreen}
            options={{
              title: 'Product',
              tabBarIcon: props => <TabBarIcon name="gift" {...props} />,
            }}
          />
          <CreateItemDetailsTopTab.Screen
            name="CreateWorkshop"
            component={PlaceholderScreen}
            options={{
              title: 'Workshop',
              tabBarIcon: props => <TabBarIcon name="brush" {...props} />,
            }}
          />
        </>
      )}
    </CreateItemDetailsTopTab.Navigator>
  );
}

export default function CreateItemNavigator() {
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
        options={{ title: 'Create' }}
      />
      <CreateItemStack.Screen
        name="CreateItemPreview"
        component={CreateItemPreviewScreen}
        options={{
          title: 'Preview',
          cardStyleInterpolator: Platform.select({
            android: CardStyleInterpolators.forHorizontalIOS,
          }),
        }}
      />
    </CreateItemStack.Navigator>
  );
}
