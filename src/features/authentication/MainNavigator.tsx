import * as React from 'react';
import { SafeAreaView, useWindowDimensions } from 'react-native';

import Icon from 'react-native-vector-icons/Ionicons';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useHeaderHeight } from '@react-navigation/elements';

import {
  createBottomTabNavigator,
  useBottomTabBarHeight,
} from '@react-navigation/bottom-tabs';

import HomeNavigator from 'src/features/home/HomeNavigator';
import ExploreNavigator from 'src/features/feed/ExploreNavigator';
import NotificationsScreen from 'src/features/notifications/NotificationsScreen';
import { LoadedProfileDetailsScreen } from 'src/features/profiles/ProfileDetailsScreen';

import * as constants from 'src/constants';
import * as notificationsSlice from 'src/features/notifications/notifications-slice';
import { useMyProfileId, useProfile } from 'src/features/profiles/hooks';
import { useAppSelector, useExtendedTheme } from 'src/hooks';
import { ProfileId } from 'src/models';

import {
  AppDrawer,
  AsyncGate,
  DiscovrrIcon,
  HeaderIcon,
  LoadingContainer,
  PlaceholderScreen,
  RouteError,
  SignInPrompt,
} from 'src/components';

import {
  FacadeBottomTabNavigationProp,
  FacadeBottomTabParamList,
  RootStackNavigationProp,
  MainDrawerParamList,
} from 'src/navigation';

const RootDrawer = createDrawerNavigator<MainDrawerParamList>();
const FacadeBottomTab = createBottomTabNavigator<FacadeBottomTabParamList>();

type MyProfileDetailsScreenProps = {
  myProfileId: ProfileId;
};

function MyProfileDetailsScreen(props: MyProfileDetailsScreenProps) {
  const profileData = useProfile(props.myProfileId);
  const headerHeight = useHeaderHeight();
  const bottomTabBarHeight = useBottomTabBarHeight();
  const { height: windowHeight } = useWindowDimensions();

  const renderRouteError = (_error?: any) => (
    <RouteError message="We weren't able to find your profile." />
  );

  return (
    <AsyncGate
      data={profileData}
      onPending={() => (
        <SafeAreaView
          style={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingTop: headerHeight,
          }}>
          <LoadingContainer message="Loading profile..." />
        </SafeAreaView>
      )}
      onFulfilled={profile => {
        if (!profile) return renderRouteError();
        return (
          <LoadedProfileDetailsScreen
            profile={profile}
            preferredTitle="You"
            preferredWindowHeight={windowHeight - bottomTabBarHeight}
          />
        );
      }}
      onRejected={renderRouteError}
    />
  );
}

function FacadeNavigator() {
  const $FUNC = '[FacadeNavigator]';
  const myProfileId = useMyProfileId();

  const { colors } = useExtendedTheme();
  const unreadCount = useAppSelector(
    notificationsSlice.selectUnreadNotificationsCount,
  );

  return (
    <FacadeBottomTab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        lazy: true,
        headerBackTitleVisible: false,
        headerTintColor: colors.text,
        headerLeft: HeaderIcon.Menu,
        headerLeftContainerStyle: {
          paddingLeft: constants.layout.defaultScreenMargins.horizontal,
        },
        headerTitleStyle: constants.font.defaultHeaderTitleStyle,
        headerTitleAllowFontScaling: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.caption,
        tabBarAllowFontScaling: false,
        tabBarStyle: {
          minHeight: constants.values.DEFAULT_MIN_BOTTOM_TAB_BAR_HEIGHT,
        },
        tabBarLabelStyle: [
          constants.font.defaultBottomTabLabelStyle,
          { marginTop: -5, marginBottom: 4 },
        ],
        tabBarBadgeStyle: {
          fontFamily: constants.font.small.fontFamily,
          fontSize: constants.font.small.fontSize,
        },
        tabBarIcon: ({ focused, color }) => {
          let iconName: string;
          let iconSize = 26;

          switch (route.name) {
            case 'Home':
              return <DiscovrrIcon size={iconSize * 0.9} color={color} />;
            case 'Explore':
              iconName = focused ? 'compass' : 'compass-outline';
              iconSize *= 1.12;
              break;
            case '__Create':
              iconName = 'add';
              iconSize *= 1.3;
              break;
            case 'Notifications':
              iconName = focused ? 'notifications' : 'notifications-outline';
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
      })}>
      <FacadeBottomTab.Screen
        name="Home"
        component={HomeNavigator}
        options={{ headerShown: false }}
      />
      <FacadeBottomTab.Screen
        name="Explore"
        component={ExploreNavigator}
        options={{ headerShown: false }}
        listeners={({
          navigation,
        }: {
          navigation: FacadeBottomTabNavigationProp;
        }) => ({
          tabLongPress: _ => {
            // Navigate to the Feed first, and then to Search - this will allow
            // `navigation.goBack()` to behave as intended when we're in the
            // `SearchQuery` screen
            navigation.navigate('Explore', {
              screen: 'Feed',
              params: { screen: 'DiscoverFeed' },
            });
            // We'll wait for a short period of time to minimise jittering
            setTimeout(() => {
              navigation.navigate('Explore', {
                screen: 'Search',
                params: { screen: 'SearchQuery' },
              });
            }, 80);
          },
        })}
      />
      <FacadeBottomTab.Screen
        name="__Create"
        component={PlaceholderScreen}
        options={{ title: 'Create' }}
        listeners={({
          navigation,
        }: {
          navigation: FacadeBottomTabNavigationProp;
        }) => ({
          tabPress: e => {
            e.preventDefault();
            if (!myProfileId) {
              navigation
                .getParent<RootStackNavigationProp>()
                .navigate('AuthPrompt', {
                  screen: 'AuthStart',
                  params: { redirected: true },
                });
            } else {
              navigation
                .getParent<RootStackNavigationProp>()
                .navigate('Create', {
                  screen: 'CreateItemDetails',
                  params: { screen: 'CreateTextPost' },
                });
            }
          },
        })}
      />
      <FacadeBottomTab.Screen
        name="Notifications"
        component={NotificationsScreen}
        // FIXME: This should reset when signing into a different account
        options={{
          title: 'Updates',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <FacadeBottomTab.Screen
        name="__MyProfile"
        options={{
          title: 'You',
          headerTransparent: Boolean(myProfileId),
          headerTintColor: constants.color.defaultLightTextColor,
        }}>
        {() =>
          myProfileId ? (
            <MyProfileDetailsScreen myProfileId={myProfileId} />
          ) : (
            <SignInPrompt clearHeaderRight />
          )
        }
      </FacadeBottomTab.Screen>
    </FacadeBottomTab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <RootDrawer.Navigator
      initialRouteName="Facade"
      drawerContent={props => <AppDrawer {...props} />}
      screenOptions={{ headerShown: false, drawerType: 'back' }}>
      <RootDrawer.Screen name="Facade" component={FacadeNavigator} />
    </RootDrawer.Navigator>
  );
}
