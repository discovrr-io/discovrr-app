import React, { Component } from 'react';

import {
  // Alert,
  StatusBar,
} from 'react-native';

import { connect } from 'react-redux';

import { createStackNavigator } from '@react-navigation/stack';

import { createDrawerNavigator } from '@react-navigation/drawer';

import auth from '@react-native-firebase/auth';
import OneSignal from 'react-native-onesignal';
import RNBootSplash from 'react-native-bootsplash';
import AsyncStorage from '@react-native-community/async-storage';

import LoginScreen from './LoginScreen';
import GroundZero from './GroundZero';
import AppDrawer from './components/AppDrawer';
// import FilteringDrawer from './components/FilteringDrawer';
import ModalActivityIndicatorAlt from './components/ModalActivityIndicatorAlt';

import { logException } from './utilities/NetworkRequests';

import { login, logout } from './utilities/Actions';

import { windowWidth } from './utilities/Constants';

const Parse = require('parse/react-native');

Parse.setAsyncStorage(AsyncStorage);
Parse.User.enableUnsafeCurrentUser();
Parse.initialize('discovrrServer');
Parse.serverURL = 'https://discovrr-uat.herokuapp.com/discovrrServer'; // production

const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
// const FilterDrawer = createDrawerNavigator();

// const PrefsDrawer = () => (
//   <FilterDrawer.Navigator
//     drawerPosition="right"
//     initialRouteName="GroundZero"
//     drawerStyle={{ width: Math.min(windowWidth * 0.8, 350) }}
//     drawerContent={(props) => <FilteringDrawer {...props} />}
//   >
//     <Drawer.Screen
//       name="GroundZero"
//       component={GroundZero}
//       options={{
//         swipeEnabled: false,
//       }}
//     />
//   </FilterDrawer.Navigator>
// );

class AuthLoadingScreen extends Component {
  constructor(props) {
    super(props);

    ({ dispatch: this.dispatch } = props);

    this.splashFadingDuration = 250;
    // this.errorLogout();
    // this.splashFadingDuration = 500000;

    if (props.isSignedIn)
      RNBootSplash.hide({ duration: this.splashFadingDuration });
    // RNBootSplash.hide({ duration: this.splashFadingDuration });

    // this.checkCurrentUser();

    this.state = {
      isInitialRender: true,
      isInitializing: true,
      isProcessing: false,
      isSignedIn: !!props.isSignedIn,
      // appState: AppState.currentState,
    };
  }

  componentDidMount() {
    this.setState({
      isInitialRender: false,
    });

    this.unsubscribeAuthChanges = auth().onAuthStateChanged(
      this.firebaseAuthStateChanged,
    );
  }

  componentWillUnmount() {
    this.unsubscribeAuthChanges();
  }

  firebaseAuthStateChanged = (user) => {
    debugAppLogger({
      info: 'onAuthStateChanged componentDidMount - AuthLoadingScreen',
      user,
    });

    const { isInitializing } = this.state;

    this.firebaseUser = user;

    if (isInitializing) {
      debugAppLogger({
        info: '*****At A',
        user,
      });

      this.setState({ isInitializing: false });

      if (user) {
        this.checkCurrentUser();
      } else {
        RNBootSplash.hide({ duration: this.splashFadingDuration });
      }
    } else if (!user) {
      debugAppLogger({
        info: '*****At B',
      });

      this.setState({ isSignedIn: false });
    } else {
      debugAppLogger({
        info: '*****At C',
      });

      this.setState({
        isProcessing: true,
      });

      this.checkCurrentUser();
    }

    // if (!user) {
    //   if (isInitializing) this.setState({ isInitializing: false });
    //
    //   RNBootSplash.hide({ duration: this.splashFadingDuration });
    // } else {
    //   this.checkCurrentUser();
    // }
  };

  checkCurrentUser = () => {
    debugAppLogger({ info: 'Gonna check Current user' });
    const { isLoggedIn, navigation: { navigate } = {} } = this.props;

    try {
      Parse.User.currentAsync()
        .then(async (currentUser) => {
          debugAppLogger({
            info: 'checkCurrentUser currentUser',
            currentUser,
          });

          if (currentUser) {
            const query = new Parse.Query(Parse.Object.extend('Profile'));
            query.equalTo('owner', currentUser);
            const parseUserProfile = await query.first();

            debugAppLogger({
              info: 'checkCurrentUser currentUser -> parseUserProfile',
              parseUserProfile,
            });

            let provider;
            if (
              Array.isArray(this.firebaseUser.providerData) &&
              this.firebaseUser.providerData.length
            ) {
              [{ providerId: provider }] = this.firebaseUser.providerData;
            }

            if (parseUserProfile && parseUserProfile.id) {
              this.dispatch(
                login({
                  provider,
                  isAnonymous: !!this.firebaseUser.isAnonymous,
                  id: currentUser.id,
                  userId: currentUser.id,
                  profileId: parseUserProfile.id,
                  email: this.firebaseUser.email,
                  phone: currentUser.get('phone'), // enjagaUser_v_Profile
                  displayName: currentUser.get('displayName'),
                  username: currentUser.get('username'),
                  name: parseUserProfile.get('name'),
                  surname: parseUserProfile.get('surname'),
                  coverPhoto: parseUserProfile.get('coverPhoto'),
                  avatar: parseUserProfile.get('avatar'),
                  gender: parseUserProfile.get('gender'),
                  ageRange: parseUserProfile.get('ageRange'),
                  description: parseUserProfile.get('description'),
                  hometown: parseUserProfile.get('hometown'),
                  likesCount: parseUserProfile.get('likesCount'),
                  followersCount: parseUserProfile.get('followersCount'),
                  followingCount: parseUserProfile.get('followingCount'),
                  postsCount: parseUserProfile.get('postsCount'),
                  followingArray: parseUserProfile.get('followingArray'),
                  blockedProfiles: parseUserProfile.get('blockedProfileArray'),
                }),
              );

              this.setState(
                {
                  isSignedIn: true,
                },
                () => {
                  this.initializeOneSignal();
                },
              );
            } else {
              this.errorLogout({});
            }

            this.setState({
              isInitializing: false,
              isProcessing: false,
            });
          } else if (isLoggedIn) {
            auth()
              .signOut(() => {
                this.dispatch(logout());
              })
              .catch(() => {});
          } else {
            const authData = {
              access_token: await this.firebaseUser.getIdToken(),
              id: this.firebaseUser.uid,
            };

            const parseUser = await Parse.User.logInWith('firebase', {
              authData,
            });

            const query = new Parse.Query(Parse.Object.extend('Profile'));
            query.equalTo('owner', parseUser);
            const parseUserProfile = await query.first();

            let syncProfile = false;

            let name = parseUserProfile.get('name');
            if (!name) {
              name =
                this.firebaseUser.name || this.firebaseUser.displayName || '';
              parseUserProfile.set('name', name);
              syncProfile = true;
            }

            let displayName = parseUserProfile.get('displayName');
            if (!displayName) {
              displayName = this.firebaseUser.displayName || '';
              parseUserProfile.set('displayName', displayName);
              syncProfile = true;
            }

            let phone = parseUserProfile.get('phone');
            if (!phone) {
              phone = this.firebaseUser.phoneNumber || '';
              parseUserProfile.set('phone', phone);
              syncProfile = true;
            }

            let email = parseUserProfile.get('email');
            if (!email) {
              email = this.firebaseUser.email || '';
              parseUserProfile.set('email', email);
              syncProfile = true;
            }

            let avatar = parseUserProfile.get('avatar');
            if (!avatar && this.firebaseUser.photoURL) {
              avatar = {
                mime: 'image/jpeg',
                type: 'image',
                url: this.firebaseUser.photoURL,
              };

              parseUserProfile.set('avatar', avatar);
              syncProfile = true;
            }

            if (syncProfile) await parseUserProfile.save();

            let provider;
            if (
              Array.isArray(this.firebaseUser.providerData) &&
              this.firebaseUser.providerData.length
            ) {
              [{ providerId: provider }] = this.firebaseUser.providerData;
            }

            this.dispatch(
              login({
                provider,
                isAnonymous: !!this.firebaseUser.isAnonymous,
                id: parseUser.id,
                userId: parseUser.id,
                profileId: parseUserProfile.id,
                email,
                phone, // enjagaUser_v_Profile
                displayName,
                // username: currentUser.get('username'),
                name,
                // surname: parseUserProfile.get('surname'),
                // coverPhoto: parseUserProfile.get('coverPhoto'),
                avatar,
                gender: parseUserProfile.get('gender'),
                ageRange: parseUserProfile.get('ageRange'),
                description: parseUserProfile.get('description'),
                hometown: parseUserProfile.get('hometown'),
                likesCount: parseUserProfile.get('likesCount'),
                followersCount: parseUserProfile.get('followersCount'),
                followingCount: parseUserProfile.get('followingCount'),
                postsCount: parseUserProfile.get('postsCount'),
                followingArray: parseUserProfile.get('followingArray'),
                blockedProfiles: parseUserProfile.get('blockedProfileArray'),
              }),
            );

            this.setState({
              isSignedIn: true,
              isProcessing: false,
            });

            debugAppLogger({
              info: 'parse logInWith - AuthLoadingScreen',
              authData,
              parseUser,
              parseUserProfile,
              firebaseUser: this.firebaseUser,
            });
          }

          RNBootSplash.hide({ duration: this.splashFadingDuration });
        })
        .catch((error) => {
          this.setState({
            isProcessing: false,
          });

          RNBootSplash.hide({ duration: this.splashFadingDuration });

          console.log({
            info: 'Error parse checkCurrent user',
            error,
          });

          this.errorLogout({});
        });
    } catch (error) {
      this.setState({
        isProcessing: false,
      });

      debugAppLogger({ info: 'Catch Error parse checkCurrent user', error });
      this.errorLogout({});
    }
  };

  initializeOneSignal = async () => {
    const {
      userDetails: {
        userId,
        profileId,
        email,
        name,
        locationPreference = '',
      } = {},
    } = this.props.userState;

    /* O N E S I G N A L   S E T U P */
    OneSignal.setAppId('c20ba65b-d412-4a82-8cc4-df3ab545c0b1');
    OneSignal.setLogLevel(6, 0);
    OneSignal.setLocationShared(false);
    OneSignal.setRequiresUserPrivacyConsent(false);

    await this.setOneSignalPlayerId(profileId);

    if (userId && profileId && email) {
      // We'll send both userId and profileId for convenience
      OneSignal.sendTags({
        userId,
        profileId,
        email,
        name,
        locationPreference,
      });

      OneSignal.setExternalUserId(userId, (results) => {
        console.log('[OneSignal]: Result of setting external id:', results);
      });
    } else {
      console.warn('One of the following required fields is not defined:', {
        userId: userId,
        profileId: profileId,
        email: email,
      });
    }

    OneSignal.promptForPushNotificationsWithUserResponse((response) => {
      console.log('[OneSignal]: Permission to push notifications:', response);
    });

    /* O N E S I G N A L  H A N D L E R S */
    OneSignal.setNotificationWillShowInForegroundHandler((event) => {
      console.log('[OneSignal]: Notification will show in foreground:', event);
    });

    OneSignal.setNotificationOpenedHandler((notification) => {
      console.log('[OneSignal]: Notification opened:', notification);
    });

    OneSignal.setInAppMessageClickHandler((event) => {
      console.log('[OneSignal]: In-app message clicked:', event);
    });

    OneSignal.addPermissionObserver((event) => {
      console.log('[OneSignal]: Permission changed:', event);
    });
  };

  errorLogout = ({ navigate, error }) => {
    Parse.User.logOut()
      .then(() => {})
      .catch(() => {
        // logException({ error: innerError })
      });

    // logException({ error });
    // navigate('Auth');
    RNBootSplash.hide({ duration: this.splashFadingDuration });
  };

  // TODO: This also needs to be invoked when the user logs in after logging out
  async setOneSignalPlayerId(profileId) {
    console.info(`Setting OneSignal player id for profile: ${profileId}`);
    const { userId: currentPlayerId } = await OneSignal.getDeviceState();

    try {
      const Profile = Parse.Object.extend('Profile');
      const profilePointer = new Profile();
      profilePointer.id = profileId;

      const oneSignalPlayerIds = profilePointer.get('oneSignalPlayerIds') ?? [];
      console.log('before:', profilePointer.get('oneSignalPlayerIds'));

      if (!oneSignalPlayerIds.includes(currentPlayerId)) {
        profilePointer.set('oneSignalPlayerIds', [
          ...oneSignalPlayerIds,
          currentPlayerId,
        ]);
        await profilePointer.save();
      }

      console.log('after:', profilePointer.get('oneSignalPlayerIds'));
    } catch (error) {
      console.error(
        `Failed to set oneSignalPlayerIds for profile '${profileId}':`,
        error,
      );
    }
  }

  render() {
    const { isInitialRender, isInitializing, isSignedIn, isProcessing } =
      this.state;

    if (isInitializing) return null;

    // const {
    //   isSignedIn,
    // } = this.props;

    debugAppLogger({
      info: 'AuthLoadingScreen render',
      isInitialRender,
      isSignedIn,
      isInitializing,
      isProcessing,
    });

    return isSignedIn ? (
      <>
        <Drawer.Navigator
          drawerStyle={isInitialRender ? { width: 0 } : undefined}
          drawerContent={(props) => <AppDrawer {...props} />}>
          <Drawer.Screen name="GroundZero" component={GroundZero} />
          {/* <Drawer.Screen name="FilteringDrawer" component={PrefsDrawer} /> */}
        </Drawer.Navigator>

        <StatusBar backgroundColor="white" barStyle="dark-content" />
      </>
    ) : (
      <>
        <Stack.Navigator headerMode="none">
          <Stack.Screen name="Login" component={LoginScreen} />
        </Stack.Navigator>

        {isProcessing && (
          <ModalActivityIndicatorAlt
            hideIndicator={false}
            opacity={0.3}
            color="white"
          />
        )}
      </>
    );
  }
}

const mapStateToProps = (state) => {
  const {
    userState = {
      isLoggedIn: 'notSignedIn',
      userDetails: {},
      locationPreference: null,
      configData: null,
    },
  } = state;

  return {
    userState,
    isSignedIn: userState.isLoggedIn === 'signedIn',
  };
};

export default connect(mapStateToProps)(AuthLoadingScreen);
