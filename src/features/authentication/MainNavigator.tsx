import React from 'react';
import { Platform } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';

import HomeNavigator from 'src/features/home/HomeNavigator';
import ExploreNavigator from 'src/features/explore/ExploreNavigator';
import NotificationsScreen from 'src/features/notifications/NotificationsScreen';
import ProfileScreen from 'src/features/profiles/ProfileScreen';

import { color, font, layout } from 'src/constants';
import { DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT } from 'src/constants/values';
import { useMyProfileId } from 'src/features/profiles/hooks';
import { selectUnreadNotificationsCount } from 'src/features/notifications/notifications-slice';
import { useAppSelector } from 'src/hooks';

import {
  AppDrawer,
  DiscovrrIcon,
  HeaderIcon,
  PlaceholderScreen,
} from 'src/components';

import {
  FacadeBottomTabNavigationProp,
  FacadeBottomTabParamList,
  RootStackNavigationProp,
  MainDrawerParamList,
} from 'src/navigation';

const RootDrawer = createDrawerNavigator<MainDrawerParamList>();
const FacadeBottomTab = createBottomTabNavigator<FacadeBottomTabParamList>();

const HEADER_HORIZONTAL_PADDING = layout.defaultScreenMargins.horizontal;

function FacadeNavigator() {
  const $FUNC = '[FacadeNavigator]';
  const myProfileId = useMyProfileId();
  const unreadCount = useAppSelector(selectUnreadNotificationsCount);

  return (
    <FacadeBottomTab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        lazy: true,
        headerBackTitleVisible: false,
        headerLeft: props => <HeaderIcon.Menu {...props} />,
        headerLeftContainerStyle: {
          paddingLeft: HEADER_HORIZONTAL_PADDING,
        },
        headerStyle: {
          backgroundColor: color.white,
          ...(route.name === 'Explore' && {
            elevation: 0,
            shadowOpacity: 0,
          }),
        },
        headerTintColor: color.black,
        headerTitleStyle: font.defaultHeaderTitleStyle,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarIcon: ({ focused, color, size: _ }) => {
          let iconName: string;
          let iconSize = 26;

          if (Platform.OS === 'ios' && route.name === 'Home') {
            return <DiscovrrIcon size={iconSize * 0.9} color={color} />;
          }

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Explore':
              // iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              iconName = focused ? 'compass' : 'compass-outline';
              iconSize *= 1.1;
              break;
            case '__Create':
              iconName = 'add';
              iconSize *= 1.25;
              break;
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
              iconSize *= 0.95;
              break;
            case '__MyProfile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              console.warn($FUNC, `Invalid route '${route.name}'`);
              iconName = 'help';
              break;
          }

          return <Icon name={iconName} size={iconSize} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: color.white,
          minHeight: DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT,
        },
        tabBarBadgeStyle: {
          fontFamily: font.small.fontFamily,
          fontSize: font.small.fontSize,
          backgroundColor: color.red500,
        },
      })}>
      <FacadeBottomTab.Screen name="Home" component={HomeNavigator} />
      <FacadeBottomTab.Screen
        name="Explore"
        component={ExploreNavigator}
        options={{ headerShown: false }}
      />
      <FacadeBottomTab.Screen
        name="__Create"
        component={PlaceholderScreen}
        options={{ title: 'Create Post' }}
        listeners={({
          navigation,
        }: {
          navigation: FacadeBottomTabNavigationProp;
        }) => ({
          tabPress: e => {
            e.preventDefault();
            navigation.getParent<RootStackNavigationProp>().navigate('Create', {
              screen: 'CreateItemDetails',
              params: { screen: 'CreateText' },
            });
          },
        })}
      />
      <FacadeBottomTab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ tabBarBadge: unreadCount > 0 ? unreadCount : undefined }}
      />
      <FacadeBottomTab.Screen
        name="__MyProfile"
        component={ProfileScreen}
        options={{ title: 'My Profile' }}
        listeners={({
          navigation,
        }: {
          navigation: FacadeBottomTabNavigationProp;
        }) => ({
          tabPress: e => {
            e.preventDefault();

            if (!myProfileId) {
              console.error('Profile ID is not defined for current user');
              return;
            }

            // Directly pass parameters as if the caller did so
            navigation.navigate('__MyProfile', {
              profileId: myProfileId,
              hideHeader: true,
            });
          },
        })}
      />
    </FacadeBottomTab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <RootDrawer.Navigator
      initialRouteName="Facade"
      drawerContent={props => <AppDrawer {...props} />}
      screenOptions={{ headerShown: false }}>
      <RootDrawer.Screen name="Facade" component={FacadeNavigator} />
    </RootDrawer.Navigator>
  );
}
