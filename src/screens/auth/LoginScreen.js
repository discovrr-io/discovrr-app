import React, { useState } from 'react';
import {
  useWindowDimensions,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
  TouchableOpacity,
  Alert,
  TouchableHighlight,
} from 'react-native';

import { connect, useDispatch } from 'react-redux';
import Video from 'react-native-video';
import auth from '@react-native-firebase/auth';

import { Formik } from 'formik';
import * as yup from 'yup';

import { Button, FormikInput } from '../../components';
import { colors, values } from '../../constants';
import * as buttonStyles from '../../components/buttons/styles';
import * as actions from '../../utilities/Actions';

const Parse = require('parse/react-native');

const discovrrLogo = require('../../../resources/images/discovrrLogoHorizontal.png');
const videoSource =
  'https://firebasestorage.googleapis.com/v0/b/discovrrapp-88c28.appspot.com/o/sys%2FloginBackgroundVideo.mp4?alt=media&token=ee3959f1-71ae-4f7b-94d9-05a3979112bc';
const videoPosterSource = Image.resolveAssetSource(
  require('../../../resources/images/videoPoster.png'),
);

const loginFormSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required('Please enter your email address')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Please enter your password')
    .min(8, 'Incomplete password'),
});

const registerFormSchema = yup.object({
  fullName: yup
    .string()
    .trim()
    .required('Please enter your full name')
    .min(3, 'Your full name should have at least 3 characters'),
  email: yup
    .string()
    .trim()
    .required('Please enter your email address')
    .email('Please enter a valid email address'),
  password: yup
    .string()
    .required('Please enter your password')
    .min(8, 'Incomplete password'),
});

const resetPasswordFormSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required('Please enter your email address')
    .email('Please enter a valid email address'),
});

function authErrorMessage(authError) {
  switch (authError.code) {
    case 'auth/wrong-password':
      return {
        title: 'Incorrect details',
        message:
          'The provided email or password is incorrect. Please try again.',
      };
    case 'auth/user-not-found':
      return {
        title: 'Invalid email address',
        message: 'The provided email is not registered with Discovrr.',
      };
    default:
      console.error('Encountered unhandled firebase error:', authError.code);
      return {
        title: 'We encountered an error',
        message:
          "We weren't able to log you in at this time. Please try again later.",
      };
  }
}

function OutlineButton({ title, disabled, onPress, ...props }) {
  return (
    <TouchableHighlight
      disabled={disabled}
      onPress={onPress}
      underlayColor={colors.gray200}
      style={[
        buttonStyles.transparentStyle.default,
        buttonStyles.bigStyle,
        {
          borderColor: disabled ? colors.gray500 : colors.black,
          marginTop: values.spacing.md,
        },
        props.style,
      ]}>
      <Text
        style={[
          buttonStyles.transparentStyle.text,
          {
            color: disabled ? colors.gray500 : colors.black,
          },
        ]}>
        {title}
      </Text>
    </TouchableHighlight>
  );
}

function TextButton({ title, disabled, onPress, ...props }) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[{ marginTop: values.spacing.lg }, props.style]}>
      <Text
        style={[
          buttonStyles.smallTextStyle,
          {
            color: disabled ? colors.gray500 : colors.accentFocused,
            textAlign: 'center',
          },
        ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function LoginForm({ setFormType }) {
  const dispatch = useDispatch();

  const [isProcessing, setIsProcessing] = useState(false);

  function dispatchLoginAction(firebaseUser, currentUser, profile) {
    console.log('[LoginScreen] Dispatching login action...');

    console.log({ firebaseUser, currentUser, profile });

    dispatch(
      actions.login({
        provider: firebaseUser.providerId,
        isAnonymous: firebaseUser.isAnonymous,
        userId: currentUser.id,
        profileId: profile.id,
        fullName:
          profile.get('fullName') ??
          profile.get('name') ??
          profile.get('displayName') ??
          firebaseUser.displayName,
        username: profile.get('username'),
        email:
          // Email may be undefined if the user is anonymous
          profile.get('email') ?? firebaseUser.email,
        phone: profile.get('phone'),
        avatar: profile.get('avatar'),
        description: profile.get('description'),
        // --- Extra details ---
        gender: profile.get('gender'),
        ageRange: profile.get('ageRange'),
        hometown: profile.get('hometown'),
        // posts: profile.get('posts'),
        // postsCount: profile.get('postsCount'),
        // likedPostsArray: profile.get('likedPostsArray'),
        // followingArray: profile.get('followingArray'),
        // blockedProfiles: profile.get('blockedProfiles'),
        // --- Deprecated fields ---
        get id() {
          console.warn('Deprecated field "id", use "userId" instead');
          return this.userId;
        },
        get name() {
          console.warn('Deprecated field "name", use "fullName" instead');
          return this.fullName;
        },
        get displayName() {
          console.warn(
            'Deprecated field "displayName", use "fullName" instead',
          );
          return this.fullName;
        },
      }),
    );
  }

  const handleLoginWithEmailAndPassword = async ({ email, password }) => {
    console.log('[LoginScreen] Starting login process...');
    setIsProcessing(true);

    try {
      const { user: firebaseUser } = await auth().signInWithEmailAndPassword(
        email,
        password,
      );
      console.log('[LoginScreen] Retrieved firebase user:', firebaseUser);

      let currentUser = await Parse.User.currentAsync();
      if (currentUser) {
        const query = new Parse.Query(Parse.Object.extend('Profile'));
        query.equalTo('owner', currentUser);

        const profile = await query.first();
        console.log('[LoginScreen] Found Parse profile:', profile);

        if (profile && profile.id) {
          dispatchLoginAction(firebaseUser, currentUser, profile);
        } else {
          console.error(
            '[LoginScreen] Found invalid currentUser:',
            currentUser,
          );
        }
      } else {
        const authData = {
          access_token: await firebaseUser.getIdToken(),
          id: firebaseUser.uid,
        };

        currentUser = await Parse.User.logInWith('firebase', { authData });
        console.log(
          '[LoginScreen] Successfully logged in with firebase:',
          currentUser,
        );

        const query = new Parse.Query(Parse.Object.extend('Profile'));
        query.equalTo('owner', currentUser);

        const profile = await query.first();
        console.log('[LoginScreen] Found Parse profile:', profile);

        let syncProfile = false;

        let fullName =
          profile.get('fullName') ||
          profile.get('name') ||
          profile.get('displayName');
        if (!fullName && firebaseUser.displayName) {
          profile.set('fullName', firebaseUser.displayName);
          syncProfile = true;
        }

        let phone = profile.get('phone');
        if (!phone && firebaseUser.phoneNumber) {
          profile.set('phone', firebaseUser.phoneNumber);
          syncProfile = true;
        }

        // May be undefined if anonymous
        let email = profile.get('email');
        if (!email && firebaseUser.email) {
          profile.set('email', firebaseUser.email);
          syncProfile = true;
        }

        let avatar = profile.get('avatar');
        if (!avatar && firebaseUser.photoURL) {
          avatar = {
            mime: 'image/jpeg',
            type: 'image',
            url: firebaseUser.photoURL,
          };

          profile.set('avatar', avatar);
          syncProfile = true;
        }

        if (syncProfile) await profile.save();
        dispatchLoginAction(firebaseUser, currentUser, profile);
      }
    } catch (error) {
      console.error('[LoginScreen] Authentication error:', error.message);
      const { title, message } = authErrorMessage(error);
      Alert.alert(title, message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Formik
      validationSchema={loginFormSchema}
      initialValues={{ email: '', password: '' }}
      onSubmit={handleLoginWithEmailAndPassword}>
      {(props) => (
        <>
          <FormikInput
            field="email"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            formikProps={props}
          />
          <FormikInput
            secureTextEntry
            field="password"
            placeholder="Password"
            formikProps={props}
          />
          <Button
            primary
            title="Sign In"
            onPress={props.handleSubmit}
            isLoading={isProcessing}
            disabled={isProcessing || !props.isValid}
            style={{ marginTop: values.spacing.md }}
          />
          <OutlineButton
            title="Create New Account"
            disabled={isProcessing}
            onPress={() => setFormType('register')}
          />
          <TextButton
            title="Forgot your password?"
            disabled={isProcessing}
            onPress={() => setFormType('forgotPassword')}
          />
        </>
      )}
    </Formik>
  );
}

function RegisterForm({ setFormType }) {
  const handleRegisterAccount = async ({ fullName, email, password }) => {};

  return (
    <Formik
      validationSchema={registerFormSchema}
      initialValues={{ fullName: '', email: '', password: '' }}
      onSubmit={handleRegisterAccount}>
      {(props) => (
        <>
          <Text
            style={[
              buttonStyles.smallTextStyle,
              {
                marginBottom: values.spacing.lg,
                marginHorizontal: values.spacing.md,
              },
            ]}>
            Welcome to Discovrr! To register an account with us, please fill in
            the details below.
          </Text>
          <FormikInput
            field="fullName"
            placeholder="Full Name"
            formikProps={props}
          />
          <FormikInput
            field="email"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            formikProps={props}
          />
          <FormikInput
            secureTextEntry
            field="password"
            placeholder="Password"
            formikProps={props}
          />
          <Button
            primary
            title="Register"
            onPress={props.handleSubmit}
            style={{ marginTop: values.spacing.md }}
          />
          <OutlineButton title="Go Back" onPress={() => setFormType('login')} />
        </>
      )}
    </Formik>
  );
}

function ForgotPasswordForm({ setFormType }) {
  const handleResetPassword = async ({ email }) => {};

  return (
    <Formik
      validationSchema={resetPasswordFormSchema}
      initialValues={{ email: '' }}
      onSubmit={handleResetPassword}>
      {(props) => (
        <>
          <Text
            style={[
              buttonStyles.smallTextStyle,
              {
                marginBottom: values.spacing.lg,
                marginHorizontal: values.spacing.md,
              },
            ]}>
            Forgot your password? No worries! Just enter your email address
            below and we'll send you a link to reset your password.
          </Text>
          <FormikInput
            field="email"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            formikProps={props}
          />
          <Button
            primary
            disabled={
              props.errors.email || (props.touched.email && !props.isValid)
            }
            title="Email Me Reset Link"
            onPress={props.handleSubmit}
            style={{ marginTop: values.spacing.md }}
          />
          <OutlineButton title="Go Back" onPress={() => setFormType('login')} />
        </>
      )}
    </Formik>
  );
}

function LoginScreen({}) {
  const { width: screenWidth } = useWindowDimensions();

  const [formType, setFormType] = useState('login');

  return (
    <View style={loginScreenStyles.backgroundVideo}>
      <Video
        muted
        repeat
        disableFocus
        playWhenInactive
        allowsExternalPlayback={false}
        controls={false}
        preventsDisplaySleepDuringVideoPlayback={false}
        paused={false}
        resizeMode="cover"
        poster={videoPosterSource.uri}
        source={{ uri: videoSource }}
        style={loginScreenStyles.backgroundVideo}
      />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          style={{
            flexGrow: 1,
            alignItems: 'center',
          }}>
          <KeyboardAvoidingView
            behavior="padding"
            keyboardVerticalOffset={values.spacing.sm}
            style={{
              flexGrow: 1,
              justifyContent: 'center',
            }}>
            <View
              style={{
                width: screenWidth * 0.9,
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                paddingVertical: values.spacing.lg * 1.5,
                paddingHorizontal: values.spacing.lg * 1.25,
                borderRadius: values.radius.lg * 1.25,
              }}>
              <Image
                source={discovrrLogo}
                style={[
                  loginScreenStyles.discovrrLogo,
                  {
                    width: screenWidth * 0.62,
                    height: undefined,
                    aspectRatio: 5105 / 1397,
                    marginBottom: values.spacing.xl,
                  },
                ]}
              />
              {(() => {
                switch (formType) {
                  case 'login':
                    return <LoginForm setFormType={setFormType} />;
                  case 'register':
                    return <RegisterForm setFormType={setFormType} />;
                  case 'forgotPassword':
                    return <ForgotPasswordForm setFormType={setFormType} />;
                  default:
                    return <LoginForm setFormType={setFormType} />;
                }
              })()}
            </View>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const loginScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },
  discovrrLogo: {
    alignSelf: 'center',
  },
});

export default connect()(LoginScreen);
