import * as React from 'react';
import {
  useWindowDimensions,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  Text,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';

import * as yup from 'yup';
import auth from '@react-native-firebase/auth';
import codePush from 'react-native-code-push';
import crashlytics from '@react-native-firebase/crashlytics';
import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import { Formik } from 'formik';
import { useNavigation } from '@react-navigation/native';

import {
  appleAuth,
  AppleButton,
} from '@invertase/react-native-apple-authentication';

import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { AuthApi } from 'src/api';
import { SOMETHING_WENT_WRONG } from 'src/constants/strings';
import { APP_VERSION, STORE_VERSION } from 'src/constants/values';
import { useAppDispatch, useExtendedTheme, useIsMounted } from 'src/hooks';
import { AuthStackNavigationProp } from 'src/navigation';

import {
  Button,
  ButtonProps,
  FormikInput,
  LoadingOverlay,
} from 'src/components';

import * as authSlice from './auth-slice';
import { useAuthState } from './hooks';

const DISCOVRR_LOGO = require('../../../assets/images/logo-horizontal.png');
const LOGIN_VIDEO_SOURCE = require('../../../assets/videos/login-video.mp4');
const LOGIN_POSTER_SOURCE = require('../../../assets/images/login-video-poster.jpg');
const LOGIN_POSTER_ASSET_SOURCE = Image.resolveAssetSource(LOGIN_POSTER_SOURCE);

const DEFAULT_ERROR_TITLE = SOMETHING_WENT_WRONG.title;
const DEFAULT_AUTH_SIGN_IN_ERROR_MESSAGE =
  "Sorry, we weren't able to sign you in at this time.";
const DEFAULT_AUTH_REGISTER_ERROR_MESSAGE =
  "Sorry, we weren't able to create your account at this time.";
const DEFAULT_AUTH_RESET_ERROR_MESSAGE =
  "Sorry, we weren't able to email you a reset link at this time.";
const REPORT_MESSAGE =
  'Please report the following error to the Discovrr development team';

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
  displayName: yup
    .string()
    .trim()
    .required('Please enter your name')
    .min(3, 'Your display name should have at least 3 characters'),
  email: yup
    .string()
    .trim()
    .required('Please enter your email address')
    .email('Please enter a valid email address'),
  username: yup
    .string()
    .trim()
    .required('Please enter a username')
    .min(3, 'Your username should have at least 3 characters')
    .max(30, 'Your username should not be more than 30 characters')
    .matches(
      constants.regex.USERNAME_REGEX,
      'Your username should only contain letters, numbers, full stops and underscores with no spaces',
    )
    .test(
      'is not a repeated symbol',
      `This username is not valid - please choose one that's more identifiable to everyone`,
      input => {
        if (!input) return false;
        return !/^(?:\.|_){3,}$/.test(input);
      },
    ),
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

function useDisallowCodePushRestarts(isProcessing: boolean) {
  const $FUNC = '[useDisallowCodePushRestarts]';
  React.useEffect(() => {
    if (isProcessing) {
      console.log($FUNC, 'Temporarily disallowing CodePush restarts');
      codePush.disallowRestart();
    }
  }, [isProcessing]);
}

function alertMessageFromFirebaseError(
  authError: any,
  defaultMessage?: string,
): { title: string; message: string } {
  switch (authError.code) {
    case 'USERNAME_TAKEN' as AuthApi.AuthApiErrorCode:
      return {
        title: 'Username Taken',
        message:
          'The username you provided is already taken by someone else. Please choose another username.',
      };
    case 'auth/wrong-password':
      return {
        title: 'Incorrect details',
        message:
          'The provided email or password is incorrect. Please try again.',
      };
    case 'auth/user-not-found':
      return {
        title: 'Invalid email address',
        message:
          'The email address you provided is not registered with Discovrr. Did you type it in correctly?',
      };
    case 'auth/email-already-in-use':
      return {
        title: 'Email already taken',
        message:
          'The email address you provided is already registered with Discovrr. Did you mean to sign in instead?',
      };
    case 'auth/username-taken':
      return {
        title: 'Username already taken',
        message:
          'The username you provided is already taken by someone else. Please choose another username.',
      };
    case 'auth/network-request-failed':
      return {
        title: DEFAULT_ERROR_TITLE,
        message:
          "We couldn't complete your request due to a network issue. Are you connected to the internet?",
      };

    default:
      // Also handles the case when error.code is undefined
      console.error('Unhandled error:', authError);
      return {
        title: DEFAULT_ERROR_TITLE,
        message: createReportMessage(authError, defaultMessage),
      };
  }
}

function createReportMessage(
  error: any,
  message: string = DEFAULT_AUTH_SIGN_IN_ERROR_MESSAGE,
): string {
  let errorMessage: string;

  if (error.message) {
    errorMessage = error.message;
  } else if (error.code) {
    errorMessage = error.code;
  } else {
    errorMessage = String(error);
  }

  return `${message}\n\n${REPORT_MESSAGE}:\n\n${errorMessage}`;
}

function LegacyButton(props: Omit<ButtonProps, 'underlayColor' | 'textStyle'>) {
  const isPrimaryContainedButton = React.useMemo(() => {
    return props.variant === 'contained' && props.type === 'primary';
  }, [props.type, props.variant]);

  return (
    <Button
      {...props}
      loadingIndicatorColor={
        isPrimaryContainedButton
          ? constants.color.defaultLightTextColor
          : undefined
      }
      underlayColor={
        isPrimaryContainedButton
          ? constants.color.accentFocused
          : constants.color.gray200
      }
      textStyle={{
        color: isPrimaryContainedButton
          ? constants.color.defaultLightTextColor
          : constants.color.defaultDarkTextColor,
      }}
    />
  );
}

type FormType = 'login' | 'register' | 'forgot-password';

type LoginFormValues = AuthApi.SignInWithEmailAndPasswordParams;
type LoginFormProps = {
  setFormType: React.Dispatch<React.SetStateAction<FormType>>;
};

function LoginForm({ setFormType }: LoginFormProps) {
  const $FUNC = '[LoginForm]';
  const dispatch = useAppDispatch();

  const isMounted = useIsMounted();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const initialFormValues: LoginFormValues = { email: '', password: '' };

  useDisallowCodePushRestarts(isProcessing);

  const handleLogin = async (form: LoginFormValues) => {
    try {
      Keyboard.dismiss();
      console.log($FUNC, 'Will login with email and password...');
      setIsProcessing(true);
      await dispatch(authSlice.signInWithEmailAndPassword(form)).unwrap();
    } catch (error) {
      console.error($FUNC, 'Failed to login with email and password:', error);
      const { title, message } = alertMessageFromFirebaseError(error);
      Alert.alert(title, message);
    } finally {
      if (isMounted.current) setIsProcessing(false);
    }
  };

  return (
    <Formik
      validationSchema={loginFormSchema}
      initialValues={initialFormValues}
      onSubmit={values =>
        handleLogin({ ...values, email: values.email.trim() })
      }>
      {props => (
        <>
          <View style={formStyles.textInputContainer}>
            <FormikInput
              formikProps={props}
              formikField="email"
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              // editable={!isProcessing}
              containerStyle={formStyles.textInput}
            />
            <FormikInput
              secureTextEntry
              formikProps={props}
              formikField="password"
              placeholder="Password"
              // editable={!isProcessing}
            />
          </View>
          <LegacyButton
            type="primary"
            variant="contained"
            title="Sign In"
            onPress={props.handleSubmit}
            containerStyle={formStyles.button}
          />
          <LegacyButton
            variant="outlined"
            title="Create New Account"
            onPress={() => setFormType('register')}
            containerStyle={formStyles.button}
          />
          <Button
            size="small"
            type="primary"
            variant="text"
            title="Forgot your password?"
            onPress={() => setFormType('forgot-password')}
            containerStyle={formStyles.button}
            textStyle={{ textDecorationLine: 'underline' }}
          />
          <Text
            style={[
              constants.font.extraSmallBold,
              { color: constants.color.gray700, textAlign: 'center' },
            ]}>
            Discovrr {APP_VERSION} ({STORE_VERSION})
          </Text>
        </>
      )}
    </Formik>
  );
}

const formStyles = StyleSheet.create({
  textInputContainer: {
    marginBottom: constants.layout.spacing.xl,
  },
  textInput: {
    marginBottom: constants.layout.spacing.md,
  },
  button: {
    marginTop: constants.layout.spacing.md,
  },
});

type RegisterFormValues = AuthApi.RegisterNewAccountParams;
type RegisterFormProps = {
  setFormType: React.Dispatch<React.SetStateAction<FormType>>;
};

function RegisterForm({ setFormType }: RegisterFormProps) {
  const $FUNC = '[RegisterForm]';
  const dispatch = useAppDispatch();
  const navigation = useNavigation<AuthStackNavigationProp>();
  const isMounted = useIsMounted();

  const [isProcessing, setIsProcessing] = React.useState(false);
  const initialFormValues: RegisterFormValues = {
    kind: 'personal',
    displayName: '',
    username: '',
    email: '',
    password: '',
  };

  useDisallowCodePushRestarts(isProcessing);

  const handleRegisterAccount = async (form: RegisterFormValues) => {
    try {
      Keyboard.dismiss();
      console.info($FUNC, 'Starting registration process...');
      setIsProcessing(true);
      await dispatch(authSlice.registerNewAccount(form)).unwrap();
    } catch (error) {
      const { title, message } = alertMessageFromFirebaseError(
        error,
        DEFAULT_AUTH_REGISTER_ERROR_MESSAGE,
      );
      Alert.alert(title, message);
    } finally {
      if (isMounted.current) setIsProcessing(false);
    }
  };

  const handleOpenTermsAndConditions = () => {
    navigation.navigate('TermsAndConditions');
  };

  return (
    <Formik
      validationSchema={registerFormSchema}
      initialValues={initialFormValues}
      onSubmit={values =>
        handleRegisterAccount({ ...values, email: values.email.trim() })
      }>
      {props => (
        <View>
          <Text
            style={[
              constants.font.smallBold,
              {
                color: constants.color.defaultDarkTextColor,
                marginBottom: constants.layout.spacing.lg,
                marginHorizontal: constants.layout.spacing.md,
              },
            ]}>
            Welcome to Discovrr! To register an account with us, please fill in
            the details below.
          </Text>
          <View style={{ marginBottom: constants.layout.spacing.md }}>
            <FormikInput
              formikProps={props}
              formikField="displayName"
              placeholder="Name"
              autoCapitalize="words"
              // editable={!isProcessing}
              containerStyle={formStyles.textInput}
            />
            <FormikInput
              formikProps={props}
              formikField="email"
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              // editable={!isProcessing}
              containerStyle={formStyles.textInput}
            />
            <FormikInput
              formikProps={props}
              formikField="username"
              placeholder="Username"
              autoCapitalize="none"
              // editable={!isProcessing}
              containerStyle={formStyles.textInput}
            />
            <FormikInput
              secureTextEntry
              formikProps={props}
              formikField="password"
              placeholder="Password"
            />
          </View>
          <LegacyButton
            type="primary"
            variant="contained"
            title="Register"
            onPress={props.handleSubmit}
            containerStyle={formStyles.button}
          />
          <LegacyButton
            variant="outlined"
            title="Go Back"
            onPress={() => setFormType('login')}
            containerStyle={formStyles.button}
          />
          <View
            style={{
              alignItems: 'center',
              marginTop: constants.layout.spacing.md * 1.5,
              marginBottom: constants.layout.spacing.sm,
            }}>
            <Text
              style={[
                constants.font.smallBold,
                { color: constants.color.gray700 },
              ]}>
              By signing up, you agree to our
            </Text>
            <TouchableOpacity onPress={handleOpenTermsAndConditions}>
              <Text
                style={[
                  constants.font.smallBold,
                  {
                    color: constants.color.accent,
                    textDecorationLine: 'underline',
                  },
                ]}>
                Terms &amp; Conditions
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Formik>
  );
}

type ForgotPasswordFormValues = { email: string };
type ForgotPasswordFormProps = {
  setFormType: React.Dispatch<React.SetStateAction<FormType>>;
};

function ForgotPasswordForm({ setFormType }: ForgotPasswordFormProps) {
  const $FUNC = '[ForgotPasswordForm]';

  const isMounted = useIsMounted();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const initialFormValues: ForgotPasswordFormValues = { email: '' };

  useDisallowCodePushRestarts(isProcessing);

  const handleResetPassword = async ({ email }: ForgotPasswordFormValues) => {
    try {
      Keyboard.dismiss();
      console.info($FUNC, 'Sending reset link...');
      setIsProcessing(true);
      await auth().sendPasswordResetEmail(email);
      Alert.alert(
        'Reset Link Sent',
        "We've sent you an email with instructions on how to reset your password.",
        [{ text: 'Okay', onPress: () => setFormType('login') }],
      );
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        Alert.alert(
          'Invalid Email Address',
          'The email address you provided is not registered with us. Did you type it in correctly?',
        );
      } else {
        const { title, message } = alertMessageFromFirebaseError(
          error,
          DEFAULT_AUTH_RESET_ERROR_MESSAGE,
        );
        Alert.alert(title, message);
      }
    } finally {
      if (isMounted.current) setIsProcessing(false);
    }
  };

  return (
    <Formik
      validationSchema={resetPasswordFormSchema}
      initialValues={initialFormValues}
      onSubmit={values =>
        handleResetPassword({ ...values, email: values.email.trim() })
      }>
      {props => (
        <>
          <Text
            style={[
              constants.font.smallBold,
              {
                color: constants.color.defaultDarkTextColor,
                marginBottom: constants.layout.spacing.lg,
                marginHorizontal: constants.layout.spacing.md,
              },
            ]}>
            Forgot your password? No worries! Just enter your email address
            below and we&apos;ll send you a link to reset your password.
          </Text>
          <FormikInput
            formikProps={props}
            formikField="email"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={{ marginBottom: constants.layout.spacing.md }}
          />
          <LegacyButton
            type="primary"
            variant="contained"
            title="Email Me Reset Link"
            loading={isProcessing}
            onPress={props.handleSubmit}
            containerStyle={formStyles.button}
          />
          <LegacyButton
            variant="outlined"
            title="Go Back"
            onPress={() => setFormType('login')}
            containerStyle={[
              formStyles.button,
              { marginBottom: constants.layout.spacing.sm * 1.5 },
            ]}
          />
        </>
      )}
    </Formik>
  );
}

export default function AuthScreen() {
  const $FUNC = '[AuthScreen]';
  const dispatch = useAppDispatch();

  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useExtendedTheme();

  const isMounted = useIsMounted();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [formType, setFormType] = React.useState<FormType>('login');

  const [status, _error] = useAuthState();

  useDisallowCodePushRestarts(isProcessing);

  const handleSignInWithApple = async () => {
    try {
      if (isProcessing) return;
      crashlytics().log('Starting Apple authentication...');
      console.log($FUNC, 'Starting Apple authentication...');
      setIsProcessing(true);

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.FULL_NAME, appleAuth.Scope.EMAIL],
      });

      if (!appleAuthRequestResponse.identityToken) {
        console.error($FUNC, `Apple identity token is undefined`);
        throw new Error(
          'No identity token found in Apple authentication response',
        );
      }

      const { identityToken, nonce } = appleAuthRequestResponse;
      const credential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce,
      );

      crashlytics().log('Signing in with credential...');
      console.log($FUNC, 'Signing in with credential...');
      await dispatch(authSlice.signInWithCredential({ credential })).unwrap();
    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
        console.log($FUNC, 'Apple authentication cancelled');
        return;
      }

      console.error($FUNC, 'Failed to sign in with Apple:', error);
      const recordedError = error instanceof Error ? error : new Error(error);
      crashlytics().recordError(recordedError);

      const message = createReportMessage(error);
      Alert.alert(DEFAULT_ERROR_TITLE, message);
    } finally {
      if (isMounted.current) setIsProcessing(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      if (isProcessing) return;
      crashlytics().log('Starting Google authentication...');
      console.log($FUNC, 'Starting Google authentication...');
      setIsProcessing(true);

      const { idToken } = await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();
      const credential = auth.GoogleAuthProvider.credential(
        idToken,
        accessToken,
      );

      crashlytics().log('Signing in with credential...');
      console.log($FUNC, 'Signing in with credential...');
      await dispatch(authSlice.signInWithCredential({ credential })).unwrap();
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log($FUNC, 'Google authentication cancelled');
        return;
      }

      console.error($FUNC, 'Failed to sign in with Google:', error);
      const recordedError = error instanceof Error ? error : new Error(error);
      crashlytics().recordError(recordedError);

      const message = createReportMessage(error);
      Alert.alert(DEFAULT_ERROR_TITLE, message);
    } finally {
      if (isMounted.current) setIsProcessing(false);
    }
  };

  const renderCurrentForm = () => {
    switch (formType) {
      case 'register':
        return <RegisterForm setFormType={setFormType} />;
      case 'forgot-password':
        return <ForgotPasswordForm setFormType={setFormType} />;
      case 'login': /* FALLTHROUGH */
      default:
        return <LoginForm setFormType={setFormType} />;
    }
  };

  return (
    <View style={authScreenStyles.container}>
      <StatusBar
        animated
        translucent
        barStyle="light-content"
        backgroundColor="transparent"
      />
      {/* Android: Sometimes the video poster takes a while to render, so we'll
          render an image behind as well. */}
      {Platform.OS === 'android' && (
        <FastImage
          source={LOGIN_POSTER_SOURCE}
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.placeholder },
          ]}
        />
      )}
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
        source={LOGIN_VIDEO_SOURCE}
        poster={LOGIN_POSTER_ASSET_SOURCE.uri}
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: Platform.select({
              android: 'transparent',
              default: colors.placeholder,
            }),
          },
        ]}
      />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={authScreenStyles.scrollView}>
        <TouchableWithoutFeedback accessible={false} onPress={Keyboard.dismiss}>
          <KeyboardAvoidingView
            behavior="position"
            keyboardVerticalOffset={-135}
            style={{ flexGrow: 1, justifyContent: 'center' }}>
            <View
              style={[
                authScreenStyles.formContainer,
                {
                  width: windowWidth * 0.9,
                  backgroundColor:
                    constants.color.absoluteWhite + utilities.percentToHex(0.9),
                },
              ]}>
              <Image
                source={DISCOVRR_LOGO}
                style={[
                  authScreenStyles.discovrrLogo,
                  {
                    width: windowWidth * 0.62,
                    height: undefined,
                    aspectRatio: 5105 / 1397,
                  },
                ]}
              />
              {renderCurrentForm()}
            </View>
          </KeyboardAvoidingView>
        </TouchableWithoutFeedback>
        {formType === 'login' && (
          <SafeAreaView style={authScreenStyles.signInButtonsContainer}>
            {Platform.OS === 'ios' /* && appleAuth.isSupported */ && (
              <AppleButton
                buttonType={AppleButton.Type.SIGN_IN}
                buttonStyle={AppleButton.Style.WHITE}
                cornerRadius={constants.layout.radius.md}
                style={{ width: 195, height: 41, marginTop: 3 }}
                onPress={handleSignInWithApple}
              />
            )}
            <GoogleSigninButton
              size={GoogleSigninButton.Size.Wide}
              style={{ width: 202, height: 48 }}
              onPress={handleSignInWithGoogle}
            />
          </SafeAreaView>
        )}
      </ScrollView>
      {status === 'signing-in' ? (
        <LoadingOverlay message="Signing you in..." />
      ) : status === 'registering' ? (
        <LoadingOverlay message="Creating your account..." />
      ) : null}
    </View>
  );
}

const authScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContainer: {
    borderRadius: constants.layout.radius.lg * 1.25,
    paddingTop: constants.layout.spacing.lg * 1.5,
    paddingBottom: constants.layout.spacing.lg,
    paddingHorizontal: constants.layout.spacing.lg * 1.25,
  },
  discovrrLogo: {
    marginBottom: constants.layout.spacing.xl,
    alignSelf: 'center',
  },
  signInButtonsContainer: {
    position: 'absolute',
    bottom: constants.layout.spacing.xl,
    alignItems: 'center',
  },
});
