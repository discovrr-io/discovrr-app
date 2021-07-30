import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import analytics from '@react-native-firebase/analytics';
import Carousel from 'react-native-snap-carousel';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './features/posts/HomeScreen';
import AccountSettingsScreen from './features/settings/AccountSettingsScreen';

import NotesScreen from './features/notes/NotesScreen';
import NoteDetailScreen from './features/notes/NoteDetailScreen';

import PostCreationScreen from './features/posts/PostCreationScreen';
import PostDetailScreen from './features/posts/PostDetailScreen';

import ProfileScreen from './features/profiles/ProfileScreen';
import ProfileEditScreen from './features/profiles/ProfileEditScreen';
import FollowerScreen from './features/profiles/FollowerScreen';

import MerchantProfileScreen from './features/merchants/MerchantProfileScreen';
import ProductCheckoutScreen from './features/products/ProductCheckoutScreen';

import { Button, LoadingOverlay, TextInput } from './components';
import { didDismissInfoModal } from './features/authentication/authSlice';
import { useAppDispatch, useAppSelector } from './hooks';
import { SOMETHING_WENT_WRONG } from './constants/strings';

import {
  colors,
  DEFAULT_ACTIVE_OPACITY,
  typography,
  values,
} from './constants';
import { Pagination } from 'react-native-snap-carousel';
import { buttonSizes } from './constants/values';

const DISCOVER_GRAPHIC = require('../assets/images/onboarding/discover.png');
const NEAR_ME_GRAPHIC = require('../assets/images/onboarding/near-me.png');
const FOLLOWING_GRAPHIC = require('../assets/images/onboarding/following.png');
const GET_STARTED_GRAPHIC = require('../assets/images/onboarding/get-started.png');

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const CreateScreen = () => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} />
);

const NotificationsScreen = () => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'white',
    }}>
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>No notifications</Text>
    </View>
  </View>
);

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="HomeScreen"
      component={HomeScreen}
      options={({ navigation }) => ({
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
        },

        headerLeft: () => (
          <MaterialIcon
            name="menu"
            size={24}
            color={colors.black}
            onPress={() => navigation.openDrawer()}
          />
        ),
        headerLeftContainerStyle: {
          marginLeft: values.spacing.md,
        },
        headerTitleAlign: 'left',
        headerTitle: () => (
          <View style={{ marginLeft: -32, marginRight: -8 }}>
            <TextInput
              filled
              search
              size="medium"
              placeholder="Search anything..."
              returnKeyType="search"
              onFocus={async () => {
                try {
                  await analytics().logEvent('tap_search_bar');
                } catch (error) {
                  console.error('Failed to end `tap_search_bar` event:', error);
                }
              }}
              onEndEditing={async ({ nativeEvent }) => {
                try {
                  const query = nativeEvent.text;
                  if (query.length === 0) return;
                  await analytics().logSearch({ search_term: query });
                } catch (error) {
                  console.error('Failed to end `search` event:', error);
                }
              }}
              style={{
                borderWidth: 0,
                backgroundColor: colors.gray100,
              }}
            />
          </View>
        ),
      })}
    />
  </Stack.Navigator>
);

const NotesStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="NotesScreen"
      component={NotesScreen}
      options={({ navigation }) => ({
        title: 'My Notes',
        headerLeft: () => (
          <MaterialIcon
            name="menu"
            size={24}
            color={colors.black}
            onPress={() => navigation.openDrawer()}
          />
        ),
        headerLeftContainerStyle: { marginLeft: values.spacing.md },
      })}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProfileScreen"
      component={ProfileScreen}
      initialParams={{ isMyProfile: true }}
      options={({ navigation }) => ({
        title: 'My Profile',
        headerLeft: () => (
          <MaterialIcon
            name="menu"
            size={24}
            color={colors.black}
            onPress={() => navigation.openDrawer()}
          />
        ),
        headerLeftContainerStyle: { marginLeft: values.spacing.md },
      })}
    />
  </Stack.Navigator>
);

const HomeTabs = () => (
  <>
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, size, color: tintColor }) => {
          let iconName = 'help';
          let isCommunityIcon = false;

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              isCommunityIcon = !focused;
              break;
            case 'Notes':
              // iconName = 'dashboard';
              iconName = focused ? 'bookmark' : 'bookmark-outline';
              break;
            case 'Create':
              iconName = focused ? 'add-box' : 'plus';
              isCommunityIcon = !focused;
              break;
            case 'Profile':
              iconName = focused ? 'account-circle' : 'account-circle-outline';
              isCommunityIcon = !focused;
              break;
            default:
            //
          }

          return isCommunityIcon ? (
            <MaterialCommunityIcon
              name={iconName}
              size={24}
              color={tintColor}
            />
          ) : (
            <MaterialIcon name={iconName} size={24} color={tintColor} />
          );
        },
      })}
      tabBarOptions={{
        allowFontScaling: false,
        activeTintColor: 'black',
        inactiveTintColor: 'gray',
      }}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Notes" component={NotesStack} />
      <Tab.Screen
        name="Create"
        component={CreateScreen}
        listeners={({ navigation }) => ({
          tabPress: (event) => {
            event.preventDefault();
            navigation.navigate('PostCreationScreen');
          },
        })}
      />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  </>
);

/**
 * @typedef {import('./models/common').ImageSource} ImageSource
 * @typedef {'top' | 'bottom'} VerticalPosition
 * @typedef {'left' | 'center' | 'right'} HorizontalPosition
 * @typedef {`${VerticalPosition}-${HorizontalPosition}`} __PointerPosition
 * @typedef {{ vertical: VerticalPosition, horizontal: HorizontalPosition }} PointerPosition
 * @typedef {{ image: ImageSource, pointerPosition: PointerPosition, title: string, caption: string }} InfoModalPage
 * @type {InfoModalPage[]}
 */
const ONBOARDING_PAGES = [
  {
    image: DISCOVER_GRAPHIC,
    pointerPosition: { vertical: 'top', horizontal: 'left' },
    title: 'Discover',
    caption:
      'The Discover tab is a place where you can see all the posts that other users have made around you about their favourite local businesses!',
  },
  {
    image: NEAR_ME_GRAPHIC,
    pointerPosition: { vertical: 'top', horizontal: 'center' },
    title: 'Near Me',
    caption:
      'The Near Me tab shows you the businesses and their products around you based on a 3km default radius.',
  },
  {
    image: FOLLOWING_GRAPHIC,
    pointerPosition: { vertical: 'top', horizontal: 'right' },
    title: 'Following',
    caption:
      'The Following tab lets you keep up to date with your friends and connect with favourite local businesses!',
  },
  {
    image: GET_STARTED_GRAPHIC,
    pointerPosition: { vertical: 'bottom', horizontal: 'right' },
    title: 'Start Posting!',
    caption:
      'Tap Create and make your first post on your favourite local business!',
  },
];

function InfoModal({ visible, onRequestClose }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const modalWidth = Math.min(screenWidth * 0.9, 380);
  const modalHeight = Math.min(screenHeight * 0.75, 480);

  /** @type {React.MutableRefObject<Carousel<InfoModalPage>} */
  const carouselRef = useRef(null);
  const [displayOnboarding, setDisplayOnboarding] = useState(false);
  const [activePageIndex, setActivePageIndex] = useState(0);

  const handleEmailPress = async () => {
    const emailLink = 'mailto:discovrr.io@gmail.com';
    const isSupported = Linking.canOpenURL(emailLink);

    if (isSupported) {
      await Linking.openURL(emailLink);
    } else {
      console.warn('Platform cannot open mail with link:', emailLink);
      Alert.alert(
        SOMETHING_WENT_WRONG.title,
        "Sorry, we couldn't open this link for you.",
      );
    }
  };

  const renderWelcomePage = () => (
    <View
      style={{
        flexGrow: 1,
        padding: values.spacing.lg + values.spacing.sm,
      }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, flexShrink: 1 }}>
        <View style={modalStyles.mainContent}>
          <View style={modalStyles.titleContainer}>
            <Text style={modalStyles.title}>Hi there 👋</Text>
          </View>
          <View style={modalStyles.messageContainer}>
            <Text
              style={[
                modalStyles.message,
                { marginBottom: values.spacing.md },
              ]}>
              Welcome! Discovrr is a place where you can explore and see what’s
              happening in your community based on a default 3km radius.
            </Text>
            <Text style={modalStyles.message}>
              This is Discovrr v2.2. Please don't hesitate to report any bugs or
              give us feedback at{' '}
              <Text
                onPress={handleEmailPress}
                style={[
                  modalStyles.message,
                  {
                    color: colors.accent,
                    textDecorationLine: 'underline',
                  },
                ]}>
                discovrr.io@gmail.com
              </Text>
              {'.'}
            </Text>
          </View>
        </View>
      </ScrollView>
      <Button
        primary
        title="Show Me Around"
        style={modalStyles.button}
        onPress={() => setDisplayOnboarding(true)}
      />
      <TouchableOpacity
        activeOpacity={DEFAULT_ACTIVE_OPACITY}
        onPress={onRequestClose}
        style={{ marginTop: values.spacing.md * 1.5 }}>
        <Text style={{ textAlign: 'center', fontSize: typography.size.md }}>
          Skip For Now
        </Text>
      </TouchableOpacity>
    </View>
  );

  /** @param {{ item: InfoModalPage, index: number }} param0 */
  const renderCurrentPage = ({ item }) => {
    return (
      <View style={onboardingPageStyles.container}>
        <Image
          source={item.image}
          resizeMode="contain"
          style={[onboardingPageStyles.image, { width: 210, height: 210 }]}
        />
        <View style={onboardingPageStyles.textContainer}>
          <Text
            style={[
              onboardingPageStyles.text,
              {
                fontSize: typography.size.h3,
                fontWeight: '600',
                marginVertical: values.spacing.md,
              },
            ]}>
            {item.title}
          </Text>
          <Text
            style={[
              onboardingPageStyles.text,
              { fontSize: typography.size.sm },
            ]}>
            {item.caption}
          </Text>
        </View>
      </View>
    );
  };

  /** @param {{ position: PointerPosition }} param0 */
  const PointerEmoji = ({ position }) => {
    /** @type {import('react-native').ViewStyle} */
    const pointerEmojiPosition = {
      top: position.vertical === 'top' ? -20 : undefined,
      bottom: position.vertical === 'bottom' ? -20 : undefined,
      left:
        position.horizontal === 'left'
          ? 20
          : position.horizontal === 'center'
          ? (modalWidth - values.spacing.xxl) / 2 - 5 // This ain't pretty, but it'll do
          : undefined,
      right: position.horizontal === 'right' ? 20 : undefined,
    };

    return (
      <View style={[{ position: 'absolute', zIndex: 1 }, pointerEmojiPosition]}>
        <Text style={{ fontSize: 45 }}>
          {position.vertical === 'top' ? '👆' : '👇'}
        </Text>
      </View>
    );
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="slide"
      onRequestClose={onRequestClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }}>
        <SafeAreaView
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <View
            style={[
              modalStyles.container,
              { width: modalWidth, height: modalHeight },
            ]}>
            {displayOnboarding ? (
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {/* <PointerEmoji
                  position={ONBOARDING_PAGES[activePageIndex].pointerPosition}
                /> */}
                <Carousel
                  ref={(c) => (carouselRef.current = c)}
                  data={ONBOARDING_PAGES}
                  sliderWidth={modalWidth}
                  itemWidth={modalWidth}
                  renderItem={renderCurrentPage}
                  onSnapToItem={setActivePageIndex}
                />
                <Pagination
                  dotsLength={ONBOARDING_PAGES.length}
                  activeDotIndex={activePageIndex}
                  dotStyle={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    marginHorizontal: values.spacing.sm,
                    backgroundColor: colors.gray700,
                  }}
                  containerStyle={{
                    // paddingTop: values.spacing.md * 1.5,
                    // paddingBottom: values.spacing.md * 1.5,
                    paddingTop: values.spacing.md * 1.25,
                    paddingBottom: values.spacing.md * 1.25,
                  }}
                  inactiveDotStyle={{ backgroundColor: colors.gray300 }}
                  inactiveDotOpacity={0.4}
                  inactiveDotScale={0.6}
                />
                {activePageIndex < ONBOARDING_PAGES.length - 1 ? (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      height: buttonSizes.lg,
                    }}
                    onPress={() => carouselRef.current.snapToNext()}>
                    <Text
                      style={{
                        fontSize: typography.size.lg,
                        fontWeight: '700',
                      }}>
                      Next
                    </Text>
                    <MaterialIcon
                      name="chevron-right"
                      size={24}
                      color={colors.black}
                    />
                  </TouchableOpacity>
                ) : (
                  <Button
                    primary
                    title="Get Started"
                    style={{
                      paddingHorizontal: values.spacing.xxl,
                      // marginBottom: values.spacing.lg,
                    }}
                    onPress={onRequestClose}
                  />
                )}
              </View>
            ) : (
              renderWelcomePage()
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const onboardingPageStyles = StyleSheet.create({
  container: {
    alignContent: 'center',
    justifyContent: 'center',
    marginTop: values.spacing.xxl,
    marginHorizontal: values.spacing.xxl,
  },
  image: {
    alignSelf: 'center',
  },
  textContainer: {
    marginTop: values.spacing.lg,
  },
  text: {
    textAlign: 'center',
    color: colors.black,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: values.radius.lg,
    justifyContent: 'center',
  },
  mainContent: {
    flexGrow: 1,
    paddingHorizontal: values.spacing.sm,
    marginBottom: values.spacing.lg,
  },
  titleContainer: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontSize: typography.size.h2 * 1.25,
    fontWeight: '700',
  },
  messageContainer: {
    flexGrow: 2,
    justifyContent: 'center',
  },
  message: {
    fontSize: typography.size.md,
    marginTop: values.spacing.md,
  },
  button: {},
});

export default function GroundZero() {
  const dispatch = useAppDispatch();

  const { status, isFirstLogin } = useAppSelector((state) => state.auth);

  return (
    <>
      <StatusBar
        animated
        barStyle="dark-content"
        backgroundColor={Platform.OS === 'android' && 'transparent'}
      />

      {status === 'signing-out' && (
        <LoadingOverlay message="Signing you out..." />
      )}

      <InfoModal
        visible={isFirstLogin}
        onRequestClose={() => {
          console.log('[GroundZero] Dismissing modal...');
          dispatch(didDismissInfoModal());
        }}
      />

      <Stack.Navigator>
        <Stack.Screen
          name="HomeTabs"
          component={HomeTabs}
          options={{
            headerShown: false,
          }}
        />

        <Stack.Screen
          name="NoteDetailScreen"
          component={NoteDetailScreen}
          options={({ route }) => ({
            title: route.params?.noteTitle ?? 'Note Details',
            headerBackTitleVisible: false,
            headerTintColor: 'black',
          })}
        />

        <Stack.Screen
          name="ProfileEditScreen"
          component={ProfileEditScreen}
          options={{
            headerBackTitleVisible: false,
            headerTintColor: 'black',
            title: 'Profile Settings',
          }}
        />

        <Stack.Screen
          name="AccountSettingsScreen"
          component={AccountSettingsScreen}
          options={{
            headerBackTitleVisible: false,
            headerTintColor: 'black',
            title: 'Account Settings',
            headerRight: () => (
              <TouchableOpacity style={{ marginRight: values.spacing.lg }}>
                <Text
                  style={{
                    fontSize: typography.size.md,
                    color: colors.accentFocused,
                  }}>
                  Save
                </Text>
              </TouchableOpacity>
            ),
          }}
        />

        <Stack.Screen
          name="PostCreationScreen"
          component={PostCreationScreen}
          options={{
            headerBackTitleVisible: false,
            headerTintColor: 'black',
            title: 'New Post',
          }}
        />

        <Stack.Screen
          name="PostDetailScreen"
          component={PostDetailScreen}
          options={() => ({
            title: 'Post',
            headerBackTitleVisible: false,
            headerTintColor: 'black',
          })}
        />

        <Stack.Screen
          name="NotificationsScreen"
          component={NotificationsScreen}
          options={{
            headerBackTitleVisible: false,
            headerTintColor: 'black',
            title: 'Notifications',
          }}
        />

        <Stack.Screen
          name="UserProfileScreen"
          component={ProfileScreen}
          options={({ route }) => ({
            title: route.params?.profileName || 'Profile',
            headerTintColor: colors.black,
            headerBackTitleVisible: false,
          })}
        />

        <Stack.Screen
          name="MerchantProfileScreen"
          component={MerchantProfileScreen}
          options={({ route }) => ({
            title: route.params?.merchantShortName || 'Profile',
            headerTintColor: colors.black,
            headerBackTitleVisible: false,
          })}
        />

        <Stack.Screen
          name="FollowerScreen"
          component={FollowerScreen}
          options={({ route }) => {
            const { profileName, selector = 'followers' } = route.params ?? {};

            const selectorTitle =
              selector === 'followers' ? 'Followers' : 'Following';

            return {
              title:
                profileName.length > 0
                  ? `${profileName} – ${selectorTitle}`
                  : selectorTitle,
              headerBackTitleVisible: false,
              headerTintColor: 'black',
            };
          }}
        />

        <Stack.Screen
          name="ProductCheckoutScreen"
          component={ProductCheckoutScreen}
          options={({ route }) => ({
            title: route.params?.productName || 'Product',
            headerTintColor: colors.black,
            headerBackTitleVisible: false,
          })}
        />
      </Stack.Navigator>
    </>
  );
}
