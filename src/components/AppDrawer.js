import React, { Component } from 'react';

import {
  Alert,
  NativeEventEmitter,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  View,
} from 'react-native';

import { DrawerItem, DrawerContentScrollView } from '@react-navigation/drawer';

import {
  Title,
  Drawer,
  Text,
  TouchableRipple,
  Snackbar,
  Switch,
} from 'react-native-paper';

import { connect } from 'react-redux';
import { getVersion } from 'react-native-device-info';

import { GoogleSignin } from '@react-native-community/google-signin';
import auth from '@react-native-firebase/auth';
import FastImage from 'react-native-fast-image';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { logout, saveLeftDrawerContext } from '../utilities/Actions';

import { colors, values } from '../constants';

const Parse = require('parse/react-native');
const defaultAvatar = require('../../resources/images/defaultAvatar.jpeg');

const isDevMode = process.env.NODE_ENV === 'development';

class AppDrawer extends Component {
  constructor(props) {
    super(props);

    this.snackbarEmitter = new NativeEventEmitter('showSnackbar');
    this.bottomSheetEmitter = new NativeEventEmitter('locationFilter');

    this.pushedUpdate = '-rc';

    ({
      dispatch: this.dispatch,
      navigation: {
        closeDrawer: this.closeDrawer,
        toggleDrawer: this.toggleDrawer,
        navigate: this.navigate,
      },
    } = props);

    this.dispatch(saveLeftDrawerContext(this.toggleDrawer));

    this.state = {
      showSnackbar: false,
      snackbarMessage: '',
    };
  }

  goToScreen = (screen) => () => {
    const { userDetails: { isAnonymous } = {} } = this.props;

    if (isAnonymous) {
      let nextAction;
      switch (screen) {
        case 'ProfileEditScreen':
        case 'NotificationsScreen':
          nextAction = {
            onFinish: () => this.goToScreen(screen)(),
          };
          break;
        default:
          break;
      }

      debugAppLogger({
        info: 'nextAction',
        nextAction,
      });

      this.showUserAuthenticationPanel(nextAction);
    } else {
      this.navigate(screen);
    }
  };

  showLocationFilter = () => {
    try {
      debugAppLogger({
        info: 'Gonna show location filter',
      });

      this.bottomSheetEmitter.emit('showPanel', {
        contentSelector: 'locationFilter',
      });

      this.closeDrawer();
    } catch (e) {
      //
    }
  };

  dismissSnackbar = () => {
    this.setState({
      showSnackbar: false,
      snackbarMessage: '',
    });
  };

  showUserAuthenticationPanel = (extraData = {}) => {
    try {
      debugAppLogger({
        info: 'Gonna show authentication panel',
        extraData,
      });

      this.bottomSheetEmitter.emit('showPanel', {
        ...extraData,
        contentSelector: 'userAuthentication',
      });

      this.closeDrawer();
    } catch (e) {
      //
    }
  };

  authAction = () => {
    const { userDetails: { isAnonymous } = {} } = this.props;

    if (isAnonymous) {
      this.showUserAuthenticationPanel();
    } else {
      this.confirmLogout();
    }
  };

  confirmLogout = () => {
    this.closeDrawer();

    Alert.alert(
      'Logout?',
      'Please confirm logging out from your account',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'ok',
          onPress: () => this.logout(),
        },
      ],
      {
        cancelable: true,
      },
    );
  };

  logout = () => {
    requestAnimationFrame(() => {
      Parse.User.logOut()
        .then(() => {
          // this.dispatch(logout());
        })
        // .catch(error => logException({ error }));
        .catch(() => {});

      const { userDetails: { provider } = {} } = this.props;

      if (provider === 'google.com') {
        GoogleSignin.revokeAccess().catch(() => {});

        GoogleSignin.signOut().catch(() => {});
      }

      this.dispatch(logout());

      auth()
        .signOut()
        .catch(() => {});
    });
  };

  showMessage = (snackbarMessage) => () => {
    if (snackbarMessage) {
      // ToastAndroid.show('Notifications Pending implementation', ToastAndroid.SHORT);
      // this.setState({
      //   snackbarMessage,
      //   showSnackbar: true,
      // });

      this.snackbarEmitter.emit('showSnackbar', {
        message: snackbarMessage,
      });
    }
  };

  render() {
    const { showSnackbar, snackbarMessage } = this.state;

    const {
      userDetails: {
        isAnonymous,
        surname,
        name,
        displayName,
        followersCount = 0,
        followingCount = 0,
        likesCount = 0,
        avatar: { url: avatarUrl } = {},
      } = {},
    } = this.props;

    const avatarImage = avatarUrl ? { uri: avatarUrl } : defaultAvatar;

    return (
      <SafeAreaView style={{ flex: 1 }}>
        <DrawerContentScrollView>
          <View style={styles.drawerContent}>
            <View style={styles.userInfoSection}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={this.goToScreen('ProfileEditScreen')}>
                <FastImage
                  source={avatarImage}
                  resizeMode={FastImage.resizeMode.cover}
                  style={{
                    backgroundColor: 'white',
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                  }}
                />
              </TouchableOpacity>

              <Title style={styles.title}>{name || displayName || '--'}</Title>

              <View
                style={{
                  borderBottomWidth: 1,
                  borderColor: '#EEEEEE',
                  marginTop: 20,
                }}
              />

              <Drawer.Section style={styles.drawerSection}>
                <DrawerItem
                  icon={({ size }) => (
                    <MaterialCommunityIcon
                      name="map-marker"
                      size={size}
                      color="black"
                    />
                  )}
                  label="Search Location"
                  onPress={this.showLocationFilter}
                />

                <DrawerItem
                  icon={({ size }) => (
                    <MaterialIcon
                      name="notifications-active"
                      size={size}
                      color="black"
                    />
                  )}
                  label="Notifications"
                  style={{
                    fontSize: 12,
                  }}
                  onPress={this.goToScreen('NotificationsScreen')}
                />

                <DrawerItem
                  icon={({ size }) => (
                    <MaterialIcon
                      name="account-circle"
                      size={size}
                      color="black"
                    />
                  )}
                  label="Profile Settings"
                  onPress={this.goToScreen('ProfileEditScreen')}
                />

                <DrawerItem
                  icon={({ size }) => (
                    <MaterialIcon
                      name="shopping-bag"
                      size={size}
                      color="black"
                    />
                  )}
                  label="Your Shopping"
                  onPress={() =>
                    Alert.alert(
                      'Feature Unavailable',
                      "Sorry, this feature isn't available at the moment.",
                    )
                  }
                />

                <DrawerItem
                  icon={({ size }) => (
                    <MaterialIcon name="settings" size={size} color="black" />
                  )}
                  label="Account Settings"
                  // onPress={this.goToScreen('AccountSettingsScreen')}
                  onPress={() =>
                    Alert.alert(
                      'Feature Unavailable',
                      "Sorry, this feature isn't available at the moment.",
                    )
                  }
                />
              </Drawer.Section>

              <Drawer.Section>
                <DrawerItem
                  icon={({ color, size }) => (
                    <MaterialIcon
                      name={isAnonymous ? 'login' : 'exit-to-app'}
                      size={size}
                      color={color}
                    />
                  )}
                  label={isAnonymous ? 'Login' : 'Logout'}
                  onPress={this.authAction}
                />
              </Drawer.Section>
            </View>
          </View>
        </DrawerContentScrollView>

        <View
          style={{
            flex: 0,
            borderTopWidth: 1,
            borderBottomWidth: 0,
            borderTopColor: '#EEEEEE',
            paddingBottom: values.spacing.lg,
          }}>
          <TouchableRipple
            // onPress={() => ToastAndroid.show('Pending implementation', ToastAndroid.SHORT)}
            onPress={this.showMessage('Dark theme pending implementation')}>
            <View style={styles.preference}>
              <Text>Dark Theme</Text>
              <View pointerEvents="none">
                <Switch value={false} />
              </View>
            </View>
          </TouchableRipple>

          <View
            style={{
              borderBottomWidth: 1,
              borderColor: '#EEEEEE',
            }}
          />

          <Text
            allowFontScaling={false}
            style={{
              color: colors.gray700,
              alignSelf: 'flex-start',
              marginTop: values.spacing.lg,
              marginLeft: values.spacing.lg,
            }}>
            v{getVersion()}
            {this.pushedUpdate}
          </Text>
        </View>

        <Snackbar
          visible={showSnackbar}
          onDismiss={this.dismissSnackbar}
          action={{
            label: 'OK',
            onPress: () => this.dismissSnackbar(),
          }}>
          {snackbarMessage}
        </Snackbar>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  drawerContent: {
    flex: 1,
  },
  userInfoSection: {
    paddingLeft: 20,
    flex: 1,
  },
  title: {
    marginTop: 20,
    fontWeight: 'bold',
  },
  caption: {
    fontSize: 14,
    lineHeight: 14,
  },
  row: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  paragraph: {
    fontWeight: 'bold',
    marginRight: 3,
  },
  drawerSection: {
    marginTop: 10,
  },
  preference: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
});

const mapStateToProps = (state) => {
  const { userState: { userDetails = {} } = {} } = state;

  return {
    userDetails,
    // appVersion: userDetails.appVersion,
  };
};

export default connect(mapStateToProps)(AppDrawer);
