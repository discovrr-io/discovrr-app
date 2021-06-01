import React from 'react';
import {
  useWindowDimensions,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { withSafeAreaInsets } from 'react-native-safe-area-context';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { IconButton, Portal } from 'react-native-paper';

import { connect } from 'react-redux';

import HomeScreen from './HomeScreen';
import BoardsScreen from './BoardsScreen';
// import PostsScreen from './PostsScreen';
import PostCreationScreen from './PostCreationScreen';
import ProfileScreen from './ProfileScreen';
import ProfileEditScreen from './ProfileEditScreen';
import AccountSettingsScreen from './AccountSettingsScreen';
import PostDetailScreen from './PostDetailScreen';
import NoteDetailScreen from './NoteDetailScreen';
import FollowerScreen from './FollowerScreen';
import ChatMessageScreen from './ChatMessageScreen';
import BottomSheetPanel from './components/BottomSheetPanel';

import { isAndroid, windowWidth } from './utilities/Constants';
import { Button } from './components';
import { colors, typography, values } from './constants';
import { TouchableOpacity } from 'react-native-gesture-handler';

const imagePlaceholder = require('../resources/images/imagePlaceholder.png');

const isDevMode = process.env.NODE_ENV === 'development';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const TopTab = createMaterialTopTabNavigator();

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
        // height: windowHeight * 0.7,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      <Text>No notifications</Text>
    </View>
  </View>
);

const HomeTopTabs = () => (
  <TopTab.Navigator
    lazy
    allowFontScaling={false}
    initialRouteName="Discover"
    // lazyPlaceholder=
    tabBarOptions={{
      // activeTintColor: 'red',
      indicatorStyle: {
        backgroundColor: '#00D8C6',
      },
      labelStyle: {
        fontSize: 12,
        textTransform: 'none',
      },
    }}>
    <Tab.Screen
      name="Discover"
      component={HomeScreen}
      initialParams={{
        postTypes: 'posts',
      }}
    />

    <Tab.Screen
      name="Near Me"
      component={HomeScreen}
      initialParams={{
        postTypes: 'nearMePosts',
      }}
    />

    <Tab.Screen
      name="Following"
      component={HomeScreen}
      initialParams={{
        postTypes: 'followingPosts',
      }}
    />
  </TopTab.Navigator>
);

const HomeStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="HomeScreen"
      component={HomeTopTabs}
      options={({ navigation }) => ({
        headerStyle: {
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitle: ({ allowFontScaling, style, children }) => {
          return (
            <View
              style={{
                width: windowWidth,
                paddingLeft: isAndroid ? 0 : 5,
                // paddingRight: 15,
                // minHeight: 50,
                paddingTop: isAndroid ? 10 : 0,
                // paddingBottom: 10,
                flexDirection: 'row',
                // backgroundColor: 'orange',
                // justifyContent: 'space-between',
                alignItems: 'center',
                // elevation: 4,
              }}>
              <IconButton
                icon="menu"
                color="#777777"
                size={20}
                style={{
                  marginLeft: isAndroid ? 0 : undefined,
                }}
                onPress={() => navigation.toggleDrawer()}
                // onPress={() => this.props.navigation.dangerouslyGetParent().dispatch(DrawerActions.toggleDrawer())}
              />

              <View
                style={{
                  // flex: 1,
                  height: 40,
                  width: '85%',
                  flexDirection: 'row',
                  // marginRight: 15,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: '#AAAAAA',
                  borderRadius: 30,
                }}>
                <TextInput
                  allowFontScaling={false}
                  autoCorrect={false}
                  autoCompleteType="street-address"
                  keyboardType="default"
                  placeholder="Search.."
                  placeholderTextColor={isAndroid ? undefined : '#BBBBBB'}
                  returnKeyType="done"
                  textContentType="addressCityAndState"
                  style={{
                    flex: 1,
                    height: 40,
                    paddingLeft: 10,
                    marginRight: 10,
                  }}
                  // onSubmitEditing={focusAction}
                  // onChangeText={updateInputValue(selector)}
                />

                <MaterialIcon
                  name="search"
                  size={28}
                  color="#777777"
                  // onPress={() => this.toggleDrawer()}
                  // onPress={this.postComment}
                />
              </View>
            </View>
          );
        },
      })}
    />
  </Stack.Navigator>
);

const BoardsStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="BoardsScreen"
      component={BoardsScreen}
      options={{
        title: 'Your Notes',
      }}
    />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="ProfileScreen"
      component={ProfileScreen}
      options={{
        headerTransparent: true,
        // headerStyle: {
        //   backgroundColor: 'rgba(255, 255, 255, 0.9)',
        //   opacity: 0.5,
        // },
        title: '',
        headerBackground: () => (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'transparent' },
            ]}
          />
        ),
      }}
    />
  </Stack.Navigator>
);

const HomeTabs = () => (
  <>
    <Tab.Navigator
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
              size={focused ? 28 : 24}
              color={tintColor}
            />
          ) : (
            <MaterialIcon
              name={iconName}
              size={focused ? 28 : 24}
              color={tintColor}
            />
          );
        },
      })}
      tabBarOptions={{
        allowFontScaling: false,
        activeTintColor: 'black',
        inactiveTintColor: 'gray',
      }}>
      <Tab.Screen name="Home" component={HomeStack} />
      <Tab.Screen name="Notes" component={BoardsStack} />
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
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        listeners={() => ({
          tabPress: (event) => {
            // if (!isDevMode) event.preventDefault();
          },
        })}
      />
    </Tab.Navigator>
  </>
);

const GroundZero = ({ navigation, insets }) => {
  const [isModalVisible, setIsModalVisible] = React.useState(true);
  const { width: screenWidth } = useWindowDimensions();

  return (
    <>
      <Modal
        transparent
        animationType="slide"
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}>
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
                { width: Math.min(screenWidth * 0.85, 360) },
              ]}>
              <View style={modalStyles.textContainer}>
                <Text style={modalStyles.title}>Hi there 👋</Text>
                <Text style={modalStyles.message}>
                  Cheers for downloading our app!
                </Text>
                <Text style={modalStyles.message}>
                  You're one of the first to use Discovrr! We're current in
                  beta, so please excuse any bugs you may encounter. In the
                  meantime, make as many posts or comments as you like! 😀
                </Text>
                <Text style={modalStyles.message}>
                  The Discovrr team is here if you have any feedback to provide.
                  Feel free to contact us via email at discovrrapp@gmail.com. We
                  value all feedback you can share!
                </Text>
              </View>
              <Button
                primary
                title="Alright that's cool"
                style={modalStyles.button}
                onPress={() => setIsModalVisible(false)}
              />
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      <Stack.Navigator>
        <Stack.Screen
          name="HomeTabs"
          component={HomeTabs}
          options={{
            headerShown: false,
          }}
          cardStyle={{
            backgroundColor: 'white',
          }}
        />

        <Stack.Screen
          name="NoteDetailScreen"
          component={NoteDetailScreen}
          options={({ route }) => ({
            title: route.params?.noteDetails?.title ?? 'Note Details',
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
            headerTransparent: true,
            headerBackground: () => (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
                ]}
              />
            ),
          }}
          cardStyle={{
            backgroundColor: 'white',
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
          cardStyle={{
            backgroundColor: 'white',
          }}
        />

        <Stack.Screen
          name="PostCreationScreen"
          component={PostCreationScreen}
          options={{
            headerBackTitleVisible: false,
            headerTintColor: 'black',
            title: 'New Post',
            // headerTransparent: true,
            // headerBackground: () => (
            //   <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]} />
            // ),
          }}
          cardStyle={{
            backgroundColor: 'white',
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
            // headerTransparent: true,
            // headerBackground: () => (
            //   <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255, 255, 255, 0.8)' }]} />
            // ),
          }}
          cardStyle={{
            backgroundColor: 'white',
          }}
        />

        <Stack.Screen
          name="ChatMessageScreen"
          component={ChatMessageScreen}
          options={{
            headerBackTitleVisible: false,
            headerTintColor: 'black',
            title: 'Direct Message',
            headerTransparent: true,
            headerBackground: () => (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
                ]}
              />
            ),
          }}
          cardStyle={{
            backgroundColor: 'white',
          }}
        />

        <Stack.Screen
          name="UserProfileScreen"
          component={ProfileScreen}
          options={{
            headerShown: false,
            headerBackTitleVisible: false,
            headerTintColor: 'white',
            title: '',
            headerTransparent: true,
            headerBackground: () => (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                ]}
              />
            ),
            cardStyle: {
              backgroundColor: 'white',
            },
          }}
        />

        <Stack.Screen
          name="FollowerScreen"
          component={FollowerScreen}
          options={({ route }) => {
            const {
              params: { userProfile, selector },
            } = route;

            const name =
              (userProfile?.name ?? '').length > 0
                ? userProfile.name
                : 'Anonymous';

            return {
              title: `${name} – ${selector}` ?? selector,
              headerBackTitleVisible: false,
              headerTintColor: 'black',
            };
          }}
        />
      </Stack.Navigator>

      <Portal>
        <BottomSheetPanel insets={insets} navigation={navigation} />
      </Portal>
    </>
  );
};

const modalStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: values.radius.lg,
    padding: values.spacing.lg + values.spacing.sm,
  },
  textContainer: {
    paddingHorizontal: values.spacing.sm,
    marginBottom: values.spacing.lg,
  },
  title: {
    fontSize: typography.size.h2,
    fontWeight: '700',
    marginBottom: values.spacing.md,
  },
  message: {
    fontSize: typography.size.md,
    marginBottom: values.spacing.md,
  },
  button: {},
});

export default connect()(withSafeAreaInsets(GroundZero));
