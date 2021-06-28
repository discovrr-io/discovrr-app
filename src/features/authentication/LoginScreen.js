import React, { useEffect, useState } from 'react';
import {
  useWindowDimensions,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  ScrollView,
} from 'react-native';

import { useDispatch } from 'react-redux';
import Video from 'react-native-video';
import auth from '@react-native-firebase/auth';

import { Formik } from 'formik';
import * as yup from 'yup';

import {
  appleAuth,
  AppleButton,
} from '@invertase/react-native-apple-authentication';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { AuthApi } from '../../api';
import { Button, FormikInput, LoadingOverlay } from '../../components';
import { colors, values } from '../../constants';
import * as buttonStyles from '../../components/buttons/styles';
import {
  registerNewAccount,
  signInWithCredential,
  signInWithEmailAndPassword,
} from './authSlice';

const DISCOVRR_LOGO = require('../../../resources/images/discovrrLogoHorizontal.png');

const VIDEO_SOURCE =
  'https://firebasestorage.googleapis.com/v0/b/discovrrapp-88c28.appspot.com/o/sys%2FloginBackgroundVideo.mp4?alt=media&token=ee3959f1-71ae-4f7b-94d9-05a3979112bc';
const VIDEO_POSTER_SOURCE = Image.resolveAssetSource(
  require('../../../resources/images/videoPoster.png'),
);

const DEFAULT_AUTH_ERROR_TITLE = 'Something went wrong';
const DEFAULT_AUTH_ERROR_MESSAGE =
  "We weren't able to sign you in at this time. Please try again later.";

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
  username: yup
    .string()
    .required('Please enter a username')
    .min(3, 'Your username should have at least 3 characters')
    .max(15, 'Your username should not be more than 15 characters')
    .matches(/^[A-Za-z_][A-Za-z0-9_]*$/, {
      message:
        'Your username should only contain letters, numbers, and underscores with no spaces',
    }),
  password: yup
    .string()
    .required('Please enter a password')
    .min(8, 'Your password should have at least 8 characters'),
});

const resetPasswordFormSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required('Please enter your email address')
    .email('Please enter a valid email address'),
});

GoogleSignin.configure();

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

/**
 * @typedef {'login' | 'register' | 'forgot-password'} FormType
 * @param {{ setFormType: (formType: FormType) => void }} param0
 */
function LoginForm({ setFormType }) {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * @param {{ email: string, password: string }} param0
   */
  const handleSignInWithEmailAndPassword = async ({ email, password }) => {
    try {
      console.info('[LoginForm] Starting login process...');
      setIsProcessing(true);

      const trimmedEmail = email.trim();
      const signInAction = signInWithEmailAndPassword({
        email: trimmedEmail,
        password,
      });

      await dispatch(signInAction).unwrap();
    } catch (error) {
      console.error(
        '[LoginForm] Failed to sign in with email and password:',
        error.message,
      );

      /** @type {string} */
      let title, message;

      switch (error.code) {
        case 'auth/wrong-password':
          title = 'Incorrect Details';
          message =
            'The email or password you provided is incorrect. Please try again.';
          break;
        case 'auth/user-not-found':
          title = 'Invalid Email Address';
          message =
            "We don't have an account registered with the email you provided. Did you type it in correctly?";
          break;
        default:
          console.warn('Unhandled error:', error);
          title = DEFAULT_AUTH_ERROR_TITLE;
          message = DEFAULT_AUTH_ERROR_MESSAGE;
          break;
      }

      Alert.alert(title, message);
    } finally {
      console.log('[LoginForm] Successfully signed in with email and password');
      setIsProcessing(false);
    }
  };

  return (
    <Formik
      validationSchema={loginFormSchema}
      initialValues={{ email: '', password: '' }}
      onSubmit={handleSignInWithEmailAndPassword}>
      {(props) => (
        <>
          <FormikInput
            field="email"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isProcessing}
            formikProps={props}
          />
          <FormikInput
            secureTextEntry
            field="password"
            placeholder="Password"
            editable={!isProcessing}
            formikProps={props}
          />
          <Button
            primary
            title="Sign In"
            isLoading={isProcessing}
            disabled={isProcessing}
            onPress={props.handleSubmit}
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
            onPress={() => setFormType('forgot-password')}
          />
        </>
      )}
    </Formik>
  );
}

/**
 * @param {{ setFormType: (formType: FormType) => void }} param0
 * @returns
 */
function RegisterForm({ setFormType }) {
  const dispatch = useDispatch();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * @param {import('./authSlice').RegisterFormDetails} registerFormDetails
   */
  const handleRegisterAccount = async (registerFormDetails) => {
    try {
      console.info('[RegisterForm] Starting registration process...');
      setIsProcessing(true);
      await dispatch(registerNewAccount(registerFormDetails)).unwrap();
    } catch (error) {
      /** @type {string} */
      let title, message;

      switch (error.code) {
        case AuthApi.AuthApiError.USERNAME_ALREADY_TAKEN:
          title = 'Username Taken';
          message =
            'The username you provided is already taken by someone else. Please choose another username.';
          break;
        case 'auth/email-already-in-use':
          title = 'Email Already In Use';
          message =
            'The email address you provided is already registered to an account at Discovrr. Did you mean to sign in?';
          break;

        default:
          console.warn('Unhandled error:', error);
          title = DEFAULT_AUTH_ERROR_TITLE;
          message = DEFAULT_AUTH_ERROR_MESSAGE;

          break;
      }

      Alert.alert(title, message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Formik
      validationSchema={registerFormSchema}
      initialValues={{ fullName: '', email: '', username: '', password: '' }}
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
            autoCapitalize="words"
            editable={!isProcessing}
            formikProps={props}
          />
          <FormikInput
            field="email"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!isProcessing}
            formikProps={props}
          />
          <FormikInput
            field="username"
            placeholder="Username"
            autoCapitalize="none"
            editable={!isProcessing}
            formikProps={props}
          />
          <FormikInput
            secureTextEntry
            field="password"
            placeholder="Password"
            editable={!isProcessing}
            formikProps={props}
          />
          <Button
            primary
            title="Register"
            onPress={props.handleSubmit}
            isLoading={isProcessing}
            disabled={isProcessing}
            style={{ marginTop: values.spacing.md }}
          />
          <OutlineButton
            title="Go Back"
            disabled={isProcessing}
            onPress={() => setFormType('login')}
          />
        </>
      )}
    </Formik>
  );
}

/**
 * @param {{ setFormType: (formType: FormType) => void }} param0
 * @returns
 */
function ForgotPasswordForm({ setFormType }) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleResetPassword = async ({ email }) => {
    try {
      console.info('[ForgotPasswordForm] Sending reset link...');
      setIsProcessing(true);
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        'Reset Link Sent',
        "We've sent you an email with instructions on how to reset your password.",
        [{ text: 'Okay', onPress: () => setFormType('login') }],
      );
    } catch (error) {
      console.error('[ForgotPasswordForm] Failed to send reset email:', error);
      if (error === 'auth/user-not-found') {
        Alert.alert(
          'Invalid Email Address',
          'The email address you provided is not registered with us. Did you type it in correctly?',
        );
      } else {
        console.warn('Unhandled error:', error);
        Alert.alert(DEFAULT_AUTH_ERROR_TITLE, DEFAULT_AUTH_ERROR_MESSAGE);
      }
    } finally {
      setIsProcessing(false);
    }
  };

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
            title="Email Me Reset Link"
            isLoading={isProcessing}
            disabled={isProcessing}
            onPress={props.handleSubmit}
            style={{ marginTop: values.spacing.md }}
          />
          <OutlineButton title="Go Back" onPress={() => setFormType('login')} />
        </>
      )}
    </Formik>
  );
}

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { width: screenWidth } = useWindowDimensions();

  const [isProcessing, setIsProcessing] = useState(false);
  const [formType, setFormType] = useState('login');

  const handleSignInWithApple = async () => {
    if (isProcessing) return;

    try {
      console.info('[LoginScreen] Starting Apple authentication...');
      setIsProcessing(true);

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      if (!appleAuthRequestResponse.identityToken) {
        console.error(`[LoginScreen] Apple identity token is undefined`);
        throw new Error(
          'No identity token found in Apple authentication response',
        );
      }

      const { identityToken, nonce } = appleAuthRequestResponse;
      const appleCredential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce,
      );

      console.log("[LoginScreen] Dispatching 'auth/signInWithCredential'...");
      await dispatch(signInWithCredential(appleCredential)).unwrap();
    } catch (error) {
      if (error.code === appleAuth.Error.CANCELED) {
        console.info('[LoginScreen] Apple authentication cancelled');
        return;
      }

      console.error('[LoginScreen] Failed to sign in with Apple:', error);
      Alert.alert(DEFAULT_AUTH_ERROR_TITLE, DEFAULT_AUTH_ERROR_MESSAGE);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    if (isProcessing) return;

    try {
      console.info('[LoginScreen] Will sign in with Google...');
      setIsProcessing(true);

      const { idToken } = await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();
      const googleCredential = auth.GoogleAuthProvider.credential(
        idToken,
        accessToken,
      );

      console.log("[LoginScreen] Dispatching 'auth/signInWithCredential'...");
      await dispatch(signInWithCredential(googleCredential)).unwrap();
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.info('[LoginScreen] Google authentication cancelled');
        return;
      }

      console.error('[LoginScreen] Failed to sign in with Google:', error);
      Alert.alert(DEFAULT_AUTH_ERROR_TITLE, DEFAULT_AUTH_ERROR_MESSAGE);
    } finally {
      setIsProcessing(false);
    }
  };

  const renderCurrentForm = () => {
    switch (formType) {
      case 'login':
        return <LoginForm setFormType={setFormType} />;
      case 'register':
        return <RegisterForm setFormType={setFormType} />;
      case 'forgot-password':
        return <ForgotPasswordForm setFormType={setFormType} />;
      default:
        return <LoginForm setFormType={setFormType} />;
    }
  };

  return (
    <View style={loginScreenStyles.container}>
      <Video
        muted
        repeat
        disableFocus
        playWhenInactive
        paused={false}
        controls={false}
        allowsExternalPlayback={false}
        preventsDisplaySleepDuringVideoPlayback={false}
        resizeMode="cover"
        posterResizeMode="cover"
        poster={VIDEO_POSTER_SOURCE.uri}
        source={{ uri: VIDEO_SOURCE }}
        style={loginScreenStyles.backgroundVideo}
      />
      <ScrollView
        contentContainerStyle={{
          justifyContent: 'center',
          flexGrow: 1,
          alignItems: 'center',
        }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior="position"
            keyboardVerticalOffset={-135}
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
                source={DISCOVRR_LOGO}
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
              {renderCurrentForm()}
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
        <View
          style={{
            position: 'absolute',
            bottom: values.spacing.lg,
            flexDirection: 'row',
          }}>
          {appleAuth.isSupported && (
            <AppleButton
              buttonStyle={AppleButton.Style.WHITE}
              buttonType={AppleButton.Type.SIGN_IN}
              style={{ width: 192, height: 41, marginTop: 3 }}
              onPress={!isProcessing ? handleSignInWithApple : null}
            />
          )}
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            style={{ width: 192, height: 48 }}
            onPress={!isProcessing ? handleSignInWithGoogle : () => {}}
          />
        </View>
      </ScrollView>
      {isProcessing && <LoadingOverlay message="Signing you in..." />}
    </View>
  );
}

const loginScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
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
