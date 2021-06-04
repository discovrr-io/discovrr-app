import React, { Component, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  Image,
  // ImageBackground,
  Keyboard,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  ToastAndroid,
  TouchableOpacity,
  View,
} from 'react-native';

import Video from 'react-native-video';
import * as Animatable from 'react-native-animatable';
import ImagePicker from 'react-native-image-crop-picker';
import RNPopoverMenu from 'react-native-popover-menu';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import auth from '@react-native-firebase/auth';
import storage from '@react-native-firebase/storage';

import {
  AppleButton,
  appleAuth,
} from '@invertase/react-native-apple-authentication';

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-community/google-signin';

import { connect } from 'react-redux';

import { withSafeAreaInsets } from 'react-native-safe-area-context';

import { login } from './utilities/Actions';

import {
  isAndroid,
  emailRegex,
  windowWidth,
  windowHeight,
} from './utilities/Constants';

import ModalActivityIndicatorAlt from './components/ModalActivityIndicatorAlt';

const Parse = require('parse/react-native');

const videoPoster = Image.resolveAssetSource(
  require('../resources/images/videoPoster.png'),
).uri;
const loginBackground = require('../resources/images/loginBackground.jpg');
const discovrrLogo = require('../resources/images/discovrrLogoHorizontal.png');
const defaultAvatar = require('../resources/images/defaultAvatar.jpeg');

const cameraIcon = <MaterialIcon name="camera-alt" color="#000000" size={24} />;
const photosIcon = (
  <MaterialIcon name="collections" color="#000000" size={24} />
);

GoogleSignin.configure();

class LoginScreen extends Component {
  constructor(props) {
    super(props);

    ({
      dispatch: this.dispatch,
      navigation: { goBack: this.goBack, navigate: this.navigate },
    } = props);

    this.ageRef = React.createRef();
    this.genderRef = React.createRef();

    this.pickerItems = {
      age: [
        { label: 'Below 18' },
        { label: '18 - 24' },
        { label: '25 - 34' },
        { label: '35 - 44' },
        { label: '45 - 54' },
        { label: '55 - 64' },
        { label: 'Above 64' },
      ],
      gender: [{ label: 'Female' }, { label: 'Male' }, { label: 'Other' }],
      avatar: [
        {
          label: 'Camera',
          // icon: cameraIcon,
        },
        {
          label: 'Photos',
          // icon: photosIcon,
        },
      ],
    };

    this.values = {
      login: {},
      register: {},
      forgot: {},
      profile: {},
    };

    this.toastMesages = {
      pending: 'Pending implementation',
    };

    this.state = {
      inputMode: 'none',
      isProcessing: false,
      isInitializing: true,
      videoHasLoaded: true,
      animatedHeight: new Animated.Value(0),
      serverError: 'Food is for the weak',
    };
  }

  componentDidMount() {
    // this.unsubscribe = auth().onAuthStateChanged(this.firebaseAuthStateChanged);

    if (isAndroid) {
      this.subscriptions = [
        Keyboard.addListener('keyboardDidShow', this.keyboardWillShow),
        Keyboard.addListener('keyboardDidHide', this.keyboardWillHide),
        BackHandler.addEventListener('hardwareBackPress', this.handleBackPress),
      ];
    } else {
      this.subscriptions = [
        Keyboard.addListener('keyboardWillShow', this.keyboardWillShow),
        Keyboard.addListener('keyboardWillHide', this.keyboardWillHide),
      ];
    }
  }

  componentWillUnmount() {
    this.subscriptions.forEach((sub) => sub.remove());

    clearTimeout(this.ignoreKeyboardHidingTimeout);

    // this.unsubscribe();
  }

  // firebaseAuthStateChanged = (user) => {
  //   debugAppLogger({
  //     info: 'onAuthStateChanged componentDidMount - LoginScreen',
  //     user,
  //   });
  //
  //   if (user) {
  //       // this.navigate('register');
  //   }
  // }

  refSelector = (selector) => (compRef) => {
    this[selector] = compRef;
  };

  handleBackPress = () => {
    const { isProcessing, inputMode } = this.state;

    if (!isProcessing) {
      switch (inputMode) {
        case 'login':
        case 'register':
        case 'signUp':
          this.performAction('none')();
          break;
        case 'forgot':
          this.performAction('login')();
          break;
        case 'profile':
          // this.performAction('profileIntro')();
          this.confirmProfileSkipping();
          break;
        case 'profileIntro':
          this.confirmProfileSkipping();
          break;
        default:
          return false;
      }
    }

    return true;
  };

  keyboardWillShow = (event) => {
    if (isAndroid) {
      this.setState({ animatedHeight: event.endCoordinates.height });
    } else {
      const { animatedHeight } = this.state;
      Animated.timing(animatedHeight, {
        toValue: event.endCoordinates.height - 40,
        duration: 200,
      }).start();
    }
  };

  keyboardWillHide = () => {
    if (isAndroid) {
      if (!this.ignoreKeyboardHiding) this.setState({ animatedHeight: 0 });
    } else {
      const { animatedHeight } = this.state;
      Animated.timing(animatedHeight, {
        toValue: 0,
        delay: 200,
        duration: 200,
      }).start();
    }
  };

  notifyUser = ({ title, message, actions }) => {
    Alert.alert(
      title,
      message,
      (Array.isArray(actions) && actions.length && actions) || [{ text: 'OK' }],
    );
  };

  confirmProfileSkipping = () => {
    this.notifyUser({
      title: 'Incomplete Profile',
      message:
        'For the best experience while using Discovrr, it is recommended that you complete your profile.',
      actions: [
        {
          text: 'Complete Profile',
          style: 'cancel',
        },
        {
          text: 'Skip',
          style: 'ok',
          // onPress: () => this.setState({ inputMode: 'none' }),
          onPress: () => {
            this.dispatch(login(this.skipUserDetails));
          },
        },
      ],
    });
  };

  toggleActivityIndicator = (isBusy = false) => {
    this.setState({ isProcessing: isBusy });
  };

  focusField = (selector) => () => {
    try {
      this.ignoreKeyboardHiding = true;
      this[selector].focus();

      this.ignoreKeyboardHidingTimeout = setTimeout(() => {
        this.ignoreKeyboardHiding = false;
      }, 200);
    } catch (e) {
      this.ignoreKeyboardHiding = false;
      //
    }
  };

  updateInputValue = (input) => (value) => {
    const { inputMode } = this.state;

    // const newValue = input === 'displayName' || input === 'password' ? value : value.toLowerCase();
    this.values[inputMode][input] = value.trim();
    this.setState({
      [`${input}Error`]: false,
    });
  };

  updatePickerInput = (selector, index, section) => {
    const selectedIndex = isAndroid ? index : section;

    debugAppLogger({
      info: 'updatePickerInput',
      selector,
      selectedIndex,
      section,
    });

    const { inputMode } = this.state;

    this.values[inputMode][selector] =
      this.pickerItems[selector][selectedIndex].label;

    this.setState({
      [selector]: this.pickerItems[selector][selectedIndex].label,
      [`${selector}Error`]: false,
    });
  };

  showPicker = (selector) => () => {
    Keyboard.dismiss();

    if (isAndroid || true) {
      const menuItems = [
        {
          menus: this.pickerItems[selector],
        },
      ];

      RNPopoverMenu.Show(this[`${selector}Ref`].current, {
        tintColor: '#FAFAFA',
        textColor: '#000000',
        menus: menuItems,
        onDone: (section, menuIndex) =>
          this.updatePickerInput(selector, menuIndex, section),
        onCancel: () => {},
      });
    } else {
      //
    }
  };

  showImageAttachmentOptions = () => {
    if (isAndroid || true) {
      RNPopoverMenu.Show(this.avatar, {
        tintColor: '#FAFAFA',
        textColor: '#000000',
        title: 'Select from',
        menus: [
          {
            menus: [
              {
                label: 'Camera',
                // icon: cameraIcon,
              },
              {
                label: 'Photos',
                // icon: photosIcon,
              },
            ],
          },
        ],
        onDone: (section, menuIndex) => {
          const selection = isAndroid ? menuIndex : section;
          ImagePicker[selection ? 'openPicker' : 'openCamera']({
            forceJpg: true,
            mediaType: 'photo',
            compressImageMaxWidth: 800,
            compressImageMaxHeight: 800,
            compressImageQuality: 0.8,
            cropping: true,
            cropperCircleOverlay: true,
            cropperToolbarTitle: 'Edit Profile Photo',
            cropperActiveWidgetColor: '#00D8C6',
            cropperStatusBarColor: '#000000',
          }).then(({ size, path, mime, width, height }) => {
            debugAppLogger({
              info: 'Attached image details',
              size,
              path,
              mime,
              width,
              height,
            });
            this.setState({
              avatarUri: path,
              avatarError: false,
            });

            this.values.profile.avatar = {
              size,
              path,
              mime,
              width,
              height,
              type: 'image',
            };
          });
        },
        onCancel: () => {},
      });
    }
  };

  performAction = (action) => () => {
    this.setState({
      inputMode: action,
      avatarUri: null,
      avatarError: false,
      age: '',
      gender: '',
      ageError: false,
      emailError: false,
      genderError: false,
      nameError: false,
      passwordError: false,
      surnameError: false,
      usernameError: false,
      displayNameError: false,
    });

    if (
      action === 'login' ||
      action === 'register' ||
      action === 'forgot' ||
      action === 'profile'
    ) {
      Object.values(this.values).forEach((value) => {
        Object.keys(value).forEach((key) => {
          value[key] = '';
        });
      });
    }
  };

  signInAnonymously = () => {
    this.setState({ isAuthenticating: true });

    auth()
      .signInAnonymously()
      .then(() => {
        this.setState({ isAuthenticating: false });
      })
      .catch((error) => {
        this.setState({ isAuthenticating: false });

        this.notifyUser({
          title: 'Login Failed',
          message: error.message,
        });
      });
  };

  signInWithApple = async () => {
    try {
      const { isProcessing, isAuthenticating } = this.state;

      if (isProcessing || isAuthenticating) return;

      this.setState({
        isAuthenticating: true,
      });

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      debugAppLogger({
        info: 'signInWithApple - LoginScreen',
        appleAuthRequestResponse,
      });

      if (!appleAuthRequestResponse.identityToken) {
        // throw 'Apple Sign-In failed - no identify token returned';

        this.notifyUser({
          title: 'Authentication Failed',
          message: 'Apple sign-in failed, please try again later',
          action: undefined,
        });

        return;
      }

      // Create a Firebase credential from the response
      const { identityToken, nonce } = appleAuthRequestResponse;

      const appleCredential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce,
      );

      debugAppLogger({
        info: 'signInWithApple - LoginScreen',
        identityToken,
        nonce,
        appleCredential,
      });

      // Sign the user in with the credential
      await auth().signInWithCredential(appleCredential);

      this.setState({
        isAuthenticating: false,
      });

      // // get current authentication state for user
      // // /!\ This method must be tested on a real device. On the iOS simulator it always throws an error.
      // const credentialState = await appleAuth.getCredentialStateForUser(appleAuthRequestResponse.user);

      //
      // // use credentialState response to ensure the user is authenticated
      // if (credentialState === appleAuth.State.AUTHORIZED) {
      //   // user is authenticated
      // }
    } catch (error) {
      this.setState({
        isAuthenticating: false,
      });

      console.log({
        info: 'Error - signInWithApple - LoginScreen',
        errorMsg: error.message,
        error,
      });
    }
  };

  signInWithGoogle = async () => {
    try {
      const { isProcessing, isAuthenticating } = this.state;

      if (isProcessing || isAuthenticating) return;

      this.setState({
        isAuthenticating: true,
      });

      let idToken;
      let accessToken;

      ({ idToken } = await GoogleSignin.signIn());

      if (isAndroid) {
        ({ idToken, accessToken } = await GoogleSignin.getTokens());
      }

      const googleCredential = auth.GoogleAuthProvider.credential(
        idToken,
        accessToken,
      );

      debugAppLogger({
        info: 'signInWithGoogle - LoginScreen',
        idToken,
        googleCredential,
      });

      await auth().signInWithCredential(googleCredential);

      this.setState({
        isAuthenticating: false,
      });
    } catch (error) {
      this.setState({
        isAuthenticating: false,
      });

      console.log({
        info: 'Error - signInWithGoogle - LoginScreen',
        errorMsg: error.message,
        error,
      });

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
        debugAppLogger({
          info: 'Error - signInWithGoogle - LoginScreen',
          extraInfo: 'user cancelled the login flow',
        });
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
        debugAppLogger({
          info: 'Error - signInWithGoogle - LoginScreen',
          extraInfo: 'operation (e.g. sign in) is in progress already',
        });
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // play services not available or outdated
        debugAppLogger({
          info: 'Error - signInWithGoogle - LoginScreen',
          extraInfo: 'play services not available or outdated',
        });
      } else {
        // some other error happened
        debugAppLogger({
          info: 'Error - signInWithGoogle - LoginScreen',
          extraInfo: 'some other error happened',
        });
      }
    }
  };

  loginUser = async () => {
    debugAppLogger({ info: 'gonna login' });
    try {
      const { email = '', password = '' } = this.values.login;

      let isBagus = true;

      if (!emailRegex.test(email)) {
        isBagus = false;
        this.flashErrorIndicator('emailError');
      }

      if (!password) {
        isBagus = false;
        this.flashErrorIndicator('passwordError');
      }

      if (isBagus) {
        this.toggleActivityIndicator(true);

        auth()
          .signInWithEmailAndPassword(email, password)
          .then(() => {
            debugAppLogger({
              info: 'loginUser firebase - LoginScreen',
              extraInfo: 'User account successfully signed in!',
            });

            this.toggleActivityIndicator();
          })
          .catch((error) => {
            this.toggleActivityIndicator();

            console.log({
              info: 'Error registerUser firebase - LoginScreen',
              errorMsg: error.message,
              error,
            });

            let message;
            switch (error.code) {
              case 'auth/email-already-in-use':
                message = `${email} is already in use!`;
                break;
              case 'auth/invalid-email':
                message = `Email address, ${email}, is invalid!`;
                break;
              default:
                // message = 'Registration failed, please try again later';
                message = error.message;
            }

            this.notifyUser({
              title: 'Login Failed',
              message,
              action: undefined,
            });
          });

        // let userDetails = {
        //   email,
        //   phone: userLogin.get('phone'),
        //   displayName: userLogin.get('displayName'),
        //   username: userLogin.get('username'),
        // };
        //
        // const query = new Parse.Query(Parse.Object.extend('Profile'));
        // query.equalTo('owner', userLogin);
        // const results = await query.find();
        // debugAppLogger({ info: 'Login succeeded', objectId: userLogin.id, results });
        //
        // if (Array.isArray(results) && results.length) {
        //   const [parseUserProfile] = results;
        //   debugAppLogger({ info: 'userProfile', parseUserProfile });
        //
        //   userDetails = {
        //     ...userDetails,
        //     name: parseUserProfile.get('name'),
        //     surname: parseUserProfile.get('surname'),
        //     avatar: parseUserProfile.get('avatar'),
        //     coverPhoto: parseUserProfile.get('coverPhoto'),
        //     gender: parseUserProfile.get('gender'),
        //     ageRange: parseUserProfile.get('ageRange'),
        //     description: parseUserProfile.get('description'),
        //     hometown: parseUserProfile.get('hometown'),
        //     likesCount: parseUserProfile.get('likesCount'),
        //     followersCount: parseUserProfile.get('followersCount'),
        //     followingCount: parseUserProfile.get('followingCount'),
        //     postsCount: parseUserProfile.get('postsCount'),
        //     id: userLogin.id,
        //     userId: userLogin.id,
        //     profileId: parseUserProfile.id,
        //     // email: currentUser.get('phone'),
        //     phone: parseUserProfile.get('phone'),
        //     displayName: parseUserProfile.get('displayName'),
        //     // username: currentUser.get('username'),
        //     followingArray: parseUserProfile.get('followingArray'),
        //     blockedProfiles: parseUserProfile.get('blockedProfileArray'),
        //   };
        // }
        //
        // debugAppLogger({
        //   info: 'Login - LoginScreen',
        //   userDetails,
        //   userLogin,
        // });
        //
        // this.dispatch(login(userDetails));
      }
    } catch (error) {
      debugAppLogger({ info: 'Login User', error: JSON.stringify(error) });
      const { code } = error;

      let { message, title } = error;

      if (code === 100) {
        title = 'Connection Failed';
        message = 'Please check your internet connection and try again.';
      }

      if (message) this.notifyUser({ title, message, action: undefined });
      this.toggleActivityIndicator();
    }
  };

  resetPassword = async () => {
    try {
      debugAppLogger({
        info: 'resetPassword - LoginScreen',
        values: this.values,
      });

      const { email = '' } = this.values.forgot;

      if (emailRegex.test(email)) {
        this.toggleActivityIndicator(true);
        Keyboard.dismiss();

        await auth()
          .sendPasswordResetEmail(email, null)
          .then(() => {
            this.notifyUser({
              title: 'Password Reset Initiated',
              message:
                'Please following the instructions sent to your email to complete reseting your password.',
              actions: [
                {
                  text: 'OK',
                  onPress: () => this.performAction('login')(),
                },
              ],
            });
          })
          .catch((error) => {
            // throw error;
            this.notifyUser({
              title: 'Password Reset Failed',
              message: error.message,
              action: undefined,
            });
          });

        this.toggleActivityIndicator(false);
      } else {
        this.flashErrorIndicator('emailError');
      }
    } catch (error) {
      console.log({
        info: 'Error resetPassword firebase - LoginScreen',
        errorMsg: error.message,
        errorCode: error.code,
        error,
      });

      this.toggleActivityIndicator(false);
    }
  };

  registerUser = async () => {
    debugAppLogger({ info: 'Gonna register' });
    try {
      const {
        // username,
        displayName,
        email,
        password,
      } = this.values.register;

      // const username = `${Date.now()}`;
      const username = email;

      let isBagus = true;

      if (!emailRegex.test(email)) {
        isBagus = false;
        this.flashErrorIndicator('emailError');
      }

      if (!password) {
        isBagus = false;
        this.flashErrorIndicator('passwordError');
      }

      if (isBagus) {
        this.toggleActivityIndicator(true);

        auth()
          .createUserWithEmailAndPassword(email, password)
          .then(() => {
            debugAppLogger({
              info: 'registerUser firebase - LoginScreen',
              extraInfo: 'User account created & signed in!',
            });

            this.toggleActivityIndicator();
          })
          .catch((error) => {
            this.toggleActivityIndicator();

            console.log({
              info: 'Error registerUser firebase - LoginScreen',
              errorMsg: error.message,
              error,
            });

            let message;
            switch (error.code) {
              case 'auth/email-already-in-use':
                message = `${email} is already in use!`;
                break;
              case 'auth/invalid-email':
                message = `Email address, ${email}, is invalid!`;
                break;
              default:
                message = error.message;
            }

            this.notifyUser({ title: '', message, action: undefined });
          });
      }
    } catch (error) {
      debugAppLogger({ info: 'Register User', error: JSON.stringify(error) });
      const { code } = error;

      let { message, title } = error;

      if (code === 100) {
        title = 'Connection Failed';
        message = 'Please check your internet connection and try again.';
      }

      if (message) this.notifyUser({ title, message, action: undefined });

      this.toggleActivityIndicator();
    }
  };

  updateUserProfile = async () => {
    try {
      const { profile: { name, surname, age, gender, avatar } = {} } =
        this.values;
      debugAppLogger({ info: 'updateUserProfile', values: this.values });

      let isBagus = true;

      if (!name) {
        isBagus = false;
        this.flashErrorIndicator('nameError');
      }

      // if (!surname) {
      //   isBagus = false;
      //   this.flashErrorIndicator('surnameError');
      // }

      // if (!age) {
      //   isBagus = false;
      //   this.flashErrorIndicator('ageError');
      // }
      //
      // if (!gender) {
      //   isBagus = false;
      //   this.flashErrorIndicator('genderError');
      // }

      if (!avatar) {
        isBagus = false;
        this.flashErrorIndicator('avatarError');
      }

      if (isBagus) {
        this.toggleActivityIndicator(true);
        Parse.User.currentAsync()
          .then(async (currentUser) => {
            debugAppLogger({ info: 'Update User Profile', currentUser });
            if (currentUser) {
              const query = new Parse.Query(Parse.Object.extend('Profile'));
              query.equalTo('owner', currentUser);
              const results = await query.find();
              debugAppLogger({
                info: 'userProfile',
                objectId: currentUser.id,
                results,
              });

              if (Array.isArray(results) && results.length) {
                const filename = `avatars/${results[0].id}_${Math.random()
                  .toString(36)
                  .substring(2)}.jpg`;
                const uploadUri = isAndroid
                  ? avatar.path
                  : avatar.path.replace('file://', '');

                const task = storage().ref(filename).putFile(uploadUri);

                await task;

                const imageUrl = await storage()
                  .ref(filename)
                  .getDownloadURL()
                  .catch(() => {});

                const [parseUserProfile] = results;
                parseUserProfile.set('name', name);
                // parseUserProfile.set('surname', surname);
                // parseUserProfile.set('ageRange', age);
                // parseUserProfile.set('gender', gender);
                parseUserProfile.set('avatar', {
                  ...avatar,
                  path: filename,
                  url: imageUrl,
                });

                await parseUserProfile.save();

                debugAppLogger({
                  info: "Successfully updated the donkey's profile ",
                });

                this.dispatch(
                  login({
                    ...this.skipUserDetails,
                    name,
                    avatar: { ...avatar, path: filename, url: imageUrl },
                  }),
                );
              }
            } else {
              // navigate('Auth');
            }

            // this.toggleActivityIndicator();
          })
          .catch((error) => {
            // alert(error.message);
            this.toggleActivityIndicator();
            debugAppLogger({ info: 'Error parse update user profile', error });

            const { code } = error;

            let { message, title } = error;

            if (code === 100) {
              title = 'Connection Failed';
              message = 'Please check your internet connection and try again.';
            }

            if (message) this.notifyUser({ title, message, action: undefined });
          });
      }
    } catch (error) {
      this.toggleActivityIndicator();
    }
  };

  flashErrorIndicator = (errorType) => {
    try {
      const { [errorType]: errorValue } = this.state;

      if (errorValue) {
        this[errorType].flash(1000).then(() => {});
      } else {
        this.setState({ [errorType]: true });
      }
    } catch (e) {
      //
    }
  };

  showToast = (selector) => () => {
    ToastAndroid.show(this.toastMesages[selector], ToastAndroid.SHORT);
  };

  videoLoaded = () => {
    this.setState({ videoHasLoaded: true });
  };

  render() {
    const {
      isInitializing,
      isProcessing,
      isAuthenticating,
      inputMode,
      avatarUri,
      animatedHeight,
      avatarError,
      ageError,
      displayNameError,
      emailError,
      genderError,
      nameError,
      passwordError,
      surnameError,
      usernameError,
      serverError,
      videoHasLoaded,
      age: selectedAge,
      gender: selectedGender,
    } = this.state;

    const {
      insets: { top: topInset, bottom: bottomInset },
    } = this.props;

    const activityColor = isProcessing ? '#AAAAAA' : 'black';

    let authComponents = null;

    debugAppLogger({
      info: 'LoginScreen render',
      isProcessing,
      isAuthenticating,
      inputMode,
      activityColor,
    });

    if (inputMode === 'none') {
      authComponents = (
        <View
          style={{
            flex: 1,
            paddingBottom: windowWidth * 0.8 * 0.271,
            justifyContent: 'center',
            backgroundColor: 'transparent',
          }}>
          <ActionButton
            label="Log in"
            backgroundColor="#0076CE"
            action={this.performAction('login')}
          />

          <ActionButton
            label="Sign up"
            backgroundColor="#00D8C6"
            action={this.performAction('register')}
            // action={this.performAction('profile')}
          />
        </View>
      );
    } else if (inputMode === 'login') {
      authComponents = (
        <View
          style={{
            flex: 1,
            // paddingBottom: windowWidth * 0.8 * 0.271,
            paddingBottom: bottomInset + 10,
            // justifyContent: 'center',
            // backgroundColor: 'orange',
          }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
            }}>
            <NavButton
              isProcessing={isProcessing}
              iconName="arrow-back-ios"
              iconSize={20}
              iconColor={videoHasLoaded ? '#FFFFFF' : '#000000'}
              action={this.performAction('none')}
            />

            <InputField
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="email"
              keyboardType="email-address"
              // placeholder="john@gmail.com"
              placeholder="Email"
              returnKeyType="next"
              textContentType="emailAddress"
              focusAction={this.focusField('password')}
              updateInputValue={this.updateInputValue}
              error={emailError}
              selector="email"
              containerStyle={{
                maxWidth: windowWidth * 0.7,
                alignSelf: 'center',
              }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            />

            <InputField
              secureTextEntry
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="password"
              keyboardType="default"
              placeholder="Password"
              returnKeyType="done"
              textContentType="password"
              focusAction={this.loginUser}
              updateInputValue={this.updateInputValue}
              error={passwordError}
              selector="password"
              containerStyle={{
                maxWidth: windowWidth * 0.7,
                alignSelf: 'center',
              }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            />

            <View style={styles.buttonLikeContainer}>
              <Text
                disabled={isProcessing}
                allowFontScaling={false}
                style={{
                  textDecorationLine: 'underline',
                  fontSize: 14,
                  paddingHorizontal: 5,
                  paddingBottom: 7,
                  color: videoHasLoaded ? 'white' : activityColor,
                }}
                onPress={this.performAction('forgot')}>
                Forgot password?
              </Text>

              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 14,
                  paddingHorizontal: 5,
                  paddingBottom: 7,
                }}
                // onPress={this.performAction('forgot')}
              >
                {' '}
              </Text>
            </View>

            <ActionButton
              isProcessing={isProcessing}
              label="Log in"
              backgroundColor="#0076CE"
              action={this.loginUser}
            />
          </View>

          <View
            style={{
              flex: 0,
              flexDirection: 'column',
              justifyContent: 'center',
              // marginTop: windowHeight * 0.1,
              alignItems: 'center',
            }}>
            <View
              style={{
                flex: 0,
                flexDirection: 'row',
                justifyContent: 'center',
                // marginTop: windowHeight * 0.1,
                alignItems: 'center',
              }}>
              {!isAndroid && (
                <AppleButton
                  // disabled={isProcessing || isAuthenticating}
                  buttonStyle={
                    videoHasLoaded
                      ? AppleButton.Style.WHITE
                      : AppleButton.Style.WHIITE
                  }
                  buttonType={AppleButton.Type.SIGN_IN}
                  style={{
                    width: 160, // You must specify a width
                    height: 42, // You must specify a height
                    marginHorizontal: 5,
                  }}
                  onPress={this.signInWithApple}
                />
              )}

              <GoogleSigninButton
                // disabled={isProcessing || isAuthenticating}
                style={{
                  width: 192,
                  height: 48,
                  marginHorizontal: 5,
                  borderRadius: 5,
                }}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Light}
                onPress={this.signInWithGoogle}
              />
            </View>

            <Text
              allowFontScaling={false}
              style={{
                fontSize: 18,
                fontWeight: '500',
                alignSelf: 'center',
                textAlign: 'center',
                marginTop: windowHeight * 0.05,
                color: 'white',
              }}
              // onPress={this.signInAnonymously}
            >
              {/* skip for now */}{' '}
            </Text>
          </View>
        </View>
      );
    } else if (inputMode === 'forgot') {
      authComponents = (
        <View
          style={{
            flex: 1,
            paddingBottom: windowWidth * 0.8 * 0.271,
            justifyContent: 'center',
          }}>
          <NavButton
            isProcessing={isProcessing}
            iconName="arrow-back-ios"
            iconSize={20}
            iconColor={videoHasLoaded ? '#FFFFFF' : '#000000'}
            action={this.performAction('login')}
          />

          <InputField
            key={inputMode}
            refSelector={this.refSelector}
            isProcessing={isProcessing}
            autoCompleteType="email"
            keyboardType="email-address"
            placeholder="Email"
            returnKeyType="done"
            textContentType="emailAddress"
            focusAction={this.resetPassword}
            updateInputValue={this.updateInputValue}
            error={emailError}
            selector="email"
            containerStyle={{
              maxWidth: windowWidth * 0.7,
              alignSelf: 'center',
            }}
            extraErrorStyles={{ bottom: 25, right: -10 }}
          />

          <ActionButton
            isProcessing={isProcessing}
            label="Reset Password"
            backgroundColor="#0076CE"
            action={this.resetPassword}
          />
        </View>
      );
    } else if (inputMode === 'register') {
      authComponents = (
        <View
          style={{
            flex: 1,
            // paddingBottom: windowWidth * 0.8 * 0.271,
            paddingBottom: bottomInset + 10,
            // justifyContent: 'center',
          }}>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
            }}>
            <NavButton
              isProcessing={isProcessing}
              iconName="arrow-back-ios"
              iconSize={20}
              iconColor={videoHasLoaded ? '#FFFFFF' : '#000000'}
              action={this.performAction('none')}
            />

            {/* <InputField
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="username"
              keyboardType="default"
              placeholder="*Username"
              returnKeyType="next"
              textContentType="name"
              focusAction={this.focusField('displayName')}
              updateInputValue={this.updateInputValue}
              error={usernameError}
              selector="username"
              extraStyles={{ marginVertical: 7 }}
              containerStyle={{ maxWidth: windowWidth * 0.7, alignSelf: 'center' }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            /> */}

            {/* <InputField
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="username"
              keyboardType="default"
              placeholder="*Display name"
              returnKeyType="next"
              textContentType="nickname"
              focusAction={this.focusField('email')}
              updateInputValue={this.updateInputValue}
              error={displayNameError}
              selector="displayName"
              extraStyles={{ marginVertical: 7 }}
              containerStyle={{ maxWidth: windowWidth * 0.7, alignSelf: 'center' }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            /> */}

            <InputField
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="email"
              keyboardType="email-address"
              // placeholder="john@gmail.com"
              placeholder="*Email"
              returnKeyType="next"
              textContentType="emailAddress"
              focusAction={this.focusField('password')}
              updateInputValue={this.updateInputValue}
              error={emailError}
              selector="email"
              extraStyles={{ marginVertical: 7 }}
              containerStyle={{
                maxWidth: windowWidth * 0.7,
                alignSelf: 'center',
              }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            />

            <InputField
              secureTextEntry
              refSelector={this.refSelector}
              isProcessing={isProcessing}
              autoCompleteType="password"
              keyboardType="default"
              placeholder="*Password"
              returnKeyType="done"
              textContentType="password"
              focusAction={this.registerUser}
              updateInputValue={this.updateInputValue}
              error={passwordError}
              selector="password"
              extraStyles={{ marginVertical: 7 }}
              containerStyle={{
                maxWidth: windowWidth * 0.7,
                alignSelf: 'center',
              }}
              extraErrorStyles={{ bottom: 25, right: -10 }}
            />

            <ActionButton
              isProcessing={isProcessing}
              label="Sign up"
              backgroundColor="#00D8C6"
              action={this.registerUser}
            />
          </View>

          <View
            style={{
              flex: 0,
              flexDirection: 'column',
              justifyContent: 'center',
              // marginTop: windowHeight * 0.1,
              alignItems: 'center',
            }}>
            <View
              style={{
                flex: 0,
                flexDirection: 'row',
                justifyContent: 'center',
                // marginTop: windowHeight * 0.1,
                alignItems: 'center',
              }}>
              {!isAndroid && (
                <AppleButton
                  // disabled={isProcessing || isAuthenticating}
                  buttonStyle={
                    videoHasLoaded
                      ? AppleButton.Style.WHITE
                      : AppleButton.Style.WHIITE
                  }
                  buttonType={AppleButton.Type.SIGN_UP}
                  style={{
                    width: 160, // You must specify a width
                    height: 42, // You must specify a height
                    marginHorizontal: 5,
                  }}
                  onPress={this.signInWithApple}
                />
              )}

              <GoogleSigninButton
                // disabled={isProcessing || isAuthenticating}
                style={{
                  width: 192,
                  height: 48,
                  marginHorizontal: 5,
                  borderRadius: 5,
                }}
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Light}
                onPress={this.signInWithGoogle}
              />
            </View>

            <Text
              allowFontScaling={false}
              style={{
                fontSize: 18,
                fontWeight: '500',
                alignSelf: 'center',
                textAlign: 'center',
                marginTop: windowHeight * 0.05,
                color: 'white',
              }}
              // onPress={this.signInAnonymously}
            >
              {/* skip for now */}{' '}
            </Text>
          </View>
        </View>
      );
    } else if (inputMode === 'profileIntro') {
      authComponents = (
        <View
          style={{
            flex: 1,
            paddingVertical: windowHeight * 0.05,
            justifyContent: 'center',
          }}>
          <View style={styles.signUpCard}>
            <View style={{ flex: 1, justifyContent: 'space-around' }}>
              <Text> </Text>

              <Text> </Text>

              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                Welcome to{'\n'}Discovrr!
              </Text>

              <Text
                allowFontScaling={false}
                style={{ fontSize: 18, textAlign: 'center' }}>
                Here are a couple of steps to give you the best experience.
              </Text>

              <Text> </Text>
            </View>

            <View style={{}}>
              <TouchableOpacity
                activeOpacity={0.9}
                style={[styles.button, { backgroundColor: '#00D8C6' }]}
                onPress={this.performAction('profile')}>
                <Text allowFontScaling={false} style={styles.buttonLabel}>
                  Next
                </Text>
              </TouchableOpacity>

              <Text
                style={styles.skipProfileAction}
                onPress={this.confirmProfileSkipping}>
                skip for now
              </Text>
            </View>
          </View>
        </View>
      );
    } else if (inputMode === 'profile') {
      let avatarImage = defaultAvatar;
      if (avatarUri) avatarImage = { uri: avatarUri };

      authComponents = (
        <View
          style={{
            flex: 1,
            paddingVertical: windowHeight * 0.05,
            justifyContent: 'center',
          }}>
          <View style={styles.signUpCard}>
            <View style={{ flex: 3, justifyContent: 'space-around' }}>
              <Text
                allowFontScaling={false}
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}>
                Tell us about yourself
              </Text>

              <View>
                <TouchableOpacity
                  ref={this.refSelector('avatar')}
                  disabled={isProcessing}
                  activeOpacity={0.8}
                  style={styles.avatarImage}
                  onPress={this.showImageAttachmentOptions}>
                  <Image
                    style={styles.avatarImage}
                    source={avatarImage}
                    resizeMode="cover"
                    resizeMethod="resize"
                  />

                  {!avatarUri && (
                    <MaterialIcon
                      name="add-a-photo"
                      size={24}
                      color="#777777"
                      style={{
                        position: 'absolute',
                        bottom: '20%',
                        right: '10%',
                      }}
                    />
                  )}
                </TouchableOpacity>

                {avatarError && (
                  <Animatable.View
                    animation="flash"
                    ref={this.refSelector('avatarError')}
                    style={[
                      styles.errorCircle,
                      { bottom: '50%', right: '23%' },
                    ]}
                  />
                )}
              </View>
            </View>

            <View style={{ flex: 1, justifyContent: 'space-around' }}>
              <InputField
                refSelector={this.refSelector}
                isProcessing={isProcessing}
                autoCompleteType="name"
                keyboardType="default"
                placeholder="*Name"
                returnKeyType="next"
                textContentType="name"
                focusAction={this.focusField('surname')}
                updateInputValue={this.updateInputValue}
                error={nameError}
                selector="name"
                extraStyles={{ marginVertical: 0 }}
              />

              {/* <InputField
                refSelector={this.refSelector}
                isProcessing={isProcessing}
                autoCompleteType="name"
                keyboardType="default"
                placeholder="*Surname"
                returnKeyType="next"
                textContentType="givenName"
                focusAction={this.showPicker('age')}
                updateInputValue={this.updateInputValue}
                error={surnameError}
                selector="surname"
                extraStyles={{ marginVertical: 0 }}
              /> */}
            </View>

            {/* <View style={styles.ageGenderContainer}>
              <View>
                <TouchableOpacity
                  ref={this.ageRef}
                  disabled={isProcessing}
                  style={styles.pickerButton}
                  onPress={this.showPicker('age')}
                >
                  <Text style={{ fontSize: 18, color: !isProcessing && selectedAge ? 'black' : '#AAAAAA' }}>
                    {selectedAge || '*Age'}
                  </Text>
                  <MaterialIcon name="expand-more" size={24} color={activityColor} />
                </TouchableOpacity>

                {ageError && (
                  <Animatable.View
                    animation="flash"
                    ref={this.refSelector('ageError')}
                    style={[styles.errorCircle, { right: -10 }]}
                  />
                )}
              </View>

              <View>
                <TouchableOpacity
                  ref={this.genderRef}
                  disabled={isProcessing}
                  style={styles.pickerButton}
                  onPress={this.showPicker('gender')}
                >
                  <Text style={{ fontSize: 18, color: !isProcessing && selectedGender ? 'black' : '#AAAAAA' }}>
                    {selectedGender || '*Gender'}
                  </Text>
                  <MaterialIcon name="expand-more" size={24} color={activityColor} />
                </TouchableOpacity>

                {genderError && (
                  <Animatable.View
                    animation="flash"
                    ref={this.refSelector('genderError')}
                    style={[styles.errorCircle, { right: -10 }]}
                  />
                )}
              </View>
            </View> */}

            <View style={{ flex: 1.5, justifyContent: 'flex-end' }}>
              <ActionButton
                isProcessing={isProcessing}
                label="Next"
                backgroundColor="#00D8C6"
                action={this.updateUserProfile}
              />

              <Text
                disabled={isProcessing}
                style={[styles.skipProfileAction, { color: activityColor }]}
                onPress={this.confirmProfileSkipping}>
                skip for now
              </Text>
            </View>

            {/* <TouchableOpacity
              activeOpacity={0.9}
              disabled={isProcessing}
              style={{ position: 'absolute', top: 7, left: 7, padding: 7 }}
              // onPress={this.performAction('profileIntro')}
              onPress={this.performAction('none')}
            >
              <MaterialIcon name="arrow-back-ios" size={20} color={activityColor} />
            </TouchableOpacity> */}
          </View>
        </View>
      );
    }
    // <KeyboardAvoidingView behavior="height" style={styles.container} contentContainerStyle={styles.container}>

    return (
      <View style={{ height: windowHeight }}>
        <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
          {/* <ImageBackground
            // source={loginBackground}
            source={{ uri: 'https://firebasestorage.googleapis.com/v0/b/discovrrapp-88c28.appspot.com/o/sys%2FvideoPoster.png?alt=media&token=d4ca6c5a-8d09-4721-9910-0e2a2e2b1578' }}
            style={styles.image}
          >
            <View
              style={[
                styles.contentContainer,
                {
                  paddingTop: isAndroid ? StatusBar.currentHeight + 10 : topInset,
                },
              ]}
            >
              <Image
                source={discovrrLogo}
                resizeMethod="resize"
                style={styles.discovrrLogo}
              />

              {authComponents}

            </View>
          </ImageBackground> */}

          <View
            // source={loginBackground}
            // source={{ uri: 'https://firebasestorage.googleapis.com/v0/b/discovrrapp-88c28.appspot.com/o/sys%2FvideoPoster.png?alt=media&token=d4ca6c5a-8d09-4721-9910-0e2a2e2b1578' }}
            style={styles.image}>
            <Video
              disableFocus
              muted
              playWhenInactive
              repeat
              allowsExternalPlayback={false}
              controls={false}
              preventsDisplaySleepDuringVideoPlayback={false}
              paused={false}
              resizeMode="cover"
              posterResizeMode="cover"
              // poster="https://firebasestorage.googleapis.com/v0/b/discovrrapp-88c28.appspot.com/o/sys%2FvideoPoster.png?alt=media&token=d4ca6c5a-8d09-4721-9910-0e2a2e2b1578"
              poster={videoPoster}
              source={{
                uri: 'https://firebasestorage.googleapis.com/v0/b/discovrrapp-88c28.appspot.com/o/sys%2FloginBackgroundVideo.mp4?alt=media&token=ee3959f1-71ae-4f7b-94d9-05a3979112bc',
              }}
              onReadyForDisplay={this.videoLoaded}
              style={styles.backgroundVideo}
            />

            <View
              style={[
                styles.contentContainer,
                {
                  paddingTop: isAndroid
                    ? StatusBar.currentHeight + 10
                    : topInset,
                },
              ]}>
              <Image
                source={discovrrLogo}
                resizeMethod="resize"
                style={styles.discovrrLogo}
              />

              {authComponents}
            </View>
          </View>

          <Animated.View style={{ height: animatedHeight }} />
        </ScrollView>

        {isAuthenticating && (
          <ModalActivityIndicatorAlt
            hideIndicator={false}
            opacity={0.3}
            color="white"
          />
        )}

        <StatusBar
          translucent
          backgroundColor="transparent"
          // barStyle="dark-content"
          barStyle={videoHasLoaded ? 'light-content' : 'dark-content'}
        />
      </View>
    );
  }
}

const InputField = ({
  refSelector,
  isProcessing,
  autoCompleteType,
  keyboardType,
  placeholder,
  returnKeyType,
  textContentType,
  error,
  focusAction,
  updateInputValue,
  selector,
  autoCapitalize = 'none',
  secureTextEntry = false,
  extraStyles = {},
  containerStyle = {},
  extraErrorStyles = {},
}) => {
  const [hidePassword, setHidePassword] = useState(true);

  return (
    <View style={containerStyle}>
      <TextInput
        ref={refSelector(selector)}
        secureTextEntry={hidePassword && secureTextEntry}
        editable={!isProcessing}
        allowFontScaling={false}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        autoCompleteType={autoCompleteType}
        keyboardType={keyboardType}
        placeholder={placeholder}
        placeholderTextColor={isAndroid ? undefined : '#BBBBBB'}
        returnKeyType={returnKeyType}
        textContentType={textContentType}
        style={[styles.textInput, { ...extraStyles }]}
        onSubmitEditing={focusAction}
        onChangeText={updateInputValue(selector)}
      />

      {!!secureTextEntry && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.passVisibilityButton}
          onPress={() => setHidePassword(!hidePassword)}>
          <MaterialIcon
            name={hidePassword ? 'visibility-off' : 'visibility'}
            size={20}
            color={isProcessing ? '#AAAAAA' : 'black'}
          />
        </TouchableOpacity>
      )}

      {error && (
        <Animatable.View
          animation="flash"
          ref={refSelector(`${selector}Error`)}
          style={[styles.errorCircle, { ...extraErrorStyles }]}
        />
      )}
    </View>
  );
};

const ActionButton = ({ isProcessing, backgroundColor, label, action }) => (
  <TouchableOpacity
    disabled={isProcessing}
    activeOpacity={0.9}
    style={[styles.button, { backgroundColor }]}
    onPress={action}>
    {isProcessing ? (
      <ActivityIndicator size="small" color="white" />
    ) : (
      <Text allowFontScaling={false} style={styles.buttonLabel}>
        {label}
      </Text>
    )}
  </TouchableOpacity>
);

const NavButton = ({ isProcessing, iconName, iconSize, iconColor, action }) => (
  <View style={[styles.buttonLikeContainer, { marginBottom: 20 }]}>
    <TouchableOpacity
      disabled={isProcessing}
      activeOpacity={0.9}
      style={{ position: 'absolute', top: 0, left: 0, padding: 7 }}
      onPress={action}>
      <MaterialIcon
        name={iconName}
        size={iconSize}
        color={isProcessing ? '#AAAAAA' : iconColor || 'black'}
      />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  image: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
    height: windowHeight,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.0)',
    // paddingTop: isAndroid ? StatusBar.currentHeight + 10 : 0,
    // justifyContent: 'center',
  },
  discovrrLogo: {
    width: windowWidth * 0.65,
    height: windowWidth * 0.65 * 0.271,
    marginTop: windowHeight * 0.05,
    alignSelf: 'center',
  },
  button: {
    width: 300,
    height: 40,
    maxWidth: windowWidth * 0.7,
    marginVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 18,
    color: 'white',
  },
  textInput: {
    width: 300,
    height: 40,
    maxWidth: windowWidth * 0.7,
    marginVertical: 10,
    paddingLeft: 20,
    borderRadius: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#727272',
  },
  buttonLikeContainer: {
    width: 300,
    height: 30,
    maxWidth: windowWidth * 0.7,
    alignSelf: 'center',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  signUpCard: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 0,
    borderRadius: 20,
    width: windowWidth * 0.85,
    // backgroundColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    alignSelf: 'center',
  },
  avatarImage: {
    borderRadius: windowWidth * 0.35,
    borderWidth: 1,
    // borderColor: '#727272',
    overflow: 'hidden',
    width: windowWidth * 0.35,
    height: windowWidth * 0.35,
    alignSelf: 'center',
  },
  ageGenderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 300,
    maxWidth: windowWidth * 0.7,
    marginVertical: 10,
    alignSelf: 'center',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderColor: '#727272',
    backgroundColor: 'white',
    borderRadius: 20,
    paddingLeft: 15,
    paddingRight: 5,
    minWidth: windowWidth * 0.3,
    maxWidth: windowWidth * 0.3,
  },
  errorCircle: {
    backgroundColor: '#C62828',
    height: 6,
    width: 6,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 17,
    right: 1,
    borderWidth: 1,
    borderColor: 'white',
  },
  passVisibilityButton: {
    position: 'absolute',
    bottom: 15,
    right: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginRight: 4,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  skipProfileAction: {
    fontSize: 18,
    alignSelf: 'center',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 15,
    paddingBottom: 7,
  },
});

// export default connect()(LoginScreen);

export default connect()(withSafeAreaInsets(LoginScreen));
