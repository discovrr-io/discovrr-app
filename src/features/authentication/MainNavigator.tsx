import React from 'react';
import { Platform, SafeAreaView, View } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabHeaderProps } from '@react-navigation/bottom-tabs/lib/typescript/src/types';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { getDefaultHeaderHeight } from '@react-navigation/elements';

import FeedNavigator from 'src/features/feed/FeedNavigator';
import ProfileScreenWrapper from 'src/features/profiles/ProfileScreen';

import { color, font, layout } from 'src/constants';
import { DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT } from 'src/constants/values';
import { useMyProfileId } from 'src/features/profiles/hooks';

import {
  AppDrawer,
  HeaderIcon,
  PlaceholderScreen,
  TextInput,
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

function FeedHeader(props: BottomTabHeaderProps) {
  const headerHeight = getDefaultHeaderHeight(props.layout, false, 0);
  return (
    <SafeAreaView>
      <View
        style={{
          flexDirection: 'row',
          minHeight: headerHeight,
          alignItems: 'center',
          paddingHorizontal: HEADER_HORIZONTAL_PADDING,
        }}>
        <HeaderIcon.Menu />
        <TextInput
          size="medium"
          placeholder="Search for anything..."
          suffix={
            <TextInput.Icon name="search" size={24} color={color.black} />
          }
          containerStyle={{
            flexGrow: 1,
            flexShrink: 1,
            marginLeft: HEADER_HORIZONTAL_PADDING,
          }}
        />
      </View>
    </SafeAreaView>
  );
}

function FacadeNavigator() {
  const myProfileId = useMyProfileId();

  return (
    <FacadeBottomTab.Navigator
      initialRouteName="Feed"
      screenOptions={({ route }) => ({
        lazy: true,
        headerBackTitleVisible: false,
        headerLeft: props => <HeaderIcon.Menu {...props} />,
        headerLeftContainerStyle: {
          paddingLeft: HEADER_HORIZONTAL_PADDING,
        },
        headerStyle: {
          backgroundColor: color.white,
          ...(route.name === 'Feed' && {
            elevation: 0,
            shadowOpacity: 0,
          }),
        },
        headerTintColor: color.black,
        headerTitleStyle: font.defaultHeaderTitleStyle,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: Platform.OS === 'android',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: string;
          switch (route.name) {
            case 'Feed':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case '__Create':
              iconName = 'add';
              size *= 1.25;
              break;
            case '__MyProfile':
              iconName = focused ? 'person' : 'person-outline';
              break;
            default:
              throw new Error(`Invalid route: '${route.name}'`);
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: color.white,
          minHeight: DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT,
        },
      })}>
      <FacadeBottomTab.Screen
        name="Feed"
        component={FeedNavigator}
        options={{ header: FeedHeader }}
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
              params: { screen: 'Text' },
            });
          },
        })}
      />
      <FacadeBottomTab.Screen
        name="__MyProfile"
        component={ProfileScreenWrapper}
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
