import * as React from 'react';
import { Platform, StatusBar, useWindowDimensions } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/core';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  CardStyleInterpolators,
  createStackNavigator,
} from '@react-navigation/stack';

import * as constants from 'src/constants';
import * as globalSelectors from 'src/global-selectors';
import { HeaderIcon, PlaceholderScreen } from 'src/components';
import { useAppSelector, useExtendedTheme } from 'src/hooks';

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
    color={props.color}
    size={props.size ?? TAB_ICON_SIZE}
  />
);

const CreateItemStack = createStackNavigator<CreateItemStackParamList>();
const CreateItemDetailsTopTab =
  createMaterialTopTabNavigator<CreateItemDetailsTopTabParamList>();

function CreateItemDetailsNavigator() {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useExtendedTheme();

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
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.caption,
        tabBarPressColor: colors.highlight,
        tabBarContentContainerStyle: {
          paddingBottom: insets.bottom,
        },
        tabBarItemStyle: {
          width: windowWidth / (myProfileKind === 'vendor' ? 5 : 3),
          paddingHorizontal: 0,
          height: constants.values.DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT * 1.25,
        },
        tabBarIndicatorStyle: {
          top: 0,
        },
        tabBarLabelStyle: [
          constants.font.defaultTopTabBarLabelStyle,
          { fontSize: constants.font.size.sm },
        ],
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
  const { colors, dark } = useExtendedTheme();

  useFocusEffect(
    React.useCallback(() => {
      if (Platform.OS !== 'ios') return;
      StatusBar.setBarStyle('light-content', true);
      return () => {
        if (!dark) StatusBar.setBarStyle('dark-content', true);
      };
    }, [dark]),
  );

  return (
    <CreateItemStack.Navigator
      initialRouteName="CreateItemDetails"
      screenOptions={({ route }) => ({
        headerTintColor: colors.text,
        headerBackTitleVisible: false,
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
        headerLeft: props =>
          route.name === 'CreateItemDetails' ? (
            <HeaderIcon.Close {...props} />
          ) : (
            <HeaderIcon.Back {...props} />
          ),
        headerLeftContainerStyle: {
          paddingLeft: constants.layout.defaultScreenMargins.horizontal,
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
