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

import { connect } from 'react-redux';
import Video from 'react-native-video';
import auth from '@react-native-firebase/auth';

import { Formik } from 'formik';
import * as yup from 'yup';
import { Button, FormikInput } from '../../components';
import { colors, typography, values } from '../../constants';
import * as buttonStyles from '../../components/buttons/styles';

const discovrrLogo = require('../../../resources/images/discovrrLogoHorizontal.png');

const videoSource =
  'https://firebasestorage.googleapis.com/v0/b/discovrrapp-88c28.appspot.com/o/sys%2FloginBackgroundVideo.mp4?alt=media&token=ee3959f1-71ae-4f7b-94d9-05a3979112bc';
const videoPosterSource = Image.resolveAssetSource(
  require('../../../resources/images/videoPoster.png'),
);

const formSchema = yup.object({
  email: yup
    .string()
    .required('Please provide your email address')
    .email('Please provide a valid email address'),
  password: yup
    .string()
    .required('Please provide your password')
    .min(8, 'Incomplete password'),
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

function LoginScreen({}) {
  const { width: screenWidth } = useWindowDimensions();

  const [isProcessing, setIsProcessing] = useState(false);

  const handleLogin = async ({ email, password }) => {
    setIsProcessing(true);

    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('[LoginScreen]: Authentication error:', error.message);
      const { title, message } = authErrorMessage(error);
      Alert.alert(title, message);
    } finally {
      setIsProcessing(false);
    }
  };

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
                backgroundColor: 'rgba(255, 255, 255, 0.85)',
                width: screenWidth * 0.9,
                paddingVertical: values.spacing.lg * 1.5,
                paddingHorizontal: values.spacing.lg * 1.25,
                borderRadius: values.radius.lg * 1.25,
              }}>
              <Image
                source={discovrrLogo}
                resizeMode="contain"
                style={[
                  loginScreenStyles.discovrrLogo,
                  {
                    width: screenWidth * 0.6,
                    height: undefined,
                    aspectRatio: 5105 / 1397,
                    marginBottom: values.spacing.xl,
                  },
                ]}
              />
              <Formik
                validationSchema={formSchema}
                initialValues={{ email: '', password: '' }}
                onSubmit={handleLogin}>
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
                      style={{ marginTop: values.spacing.md }}
                    />
                    <TouchableHighlight
                      onPress={() => {}}
                      underlayColor={colors.gray200}
                      disabled={
                        props.touched.email &&
                        props.touched.password &&
                        !props.isValid
                      }
                      style={[
                        buttonStyles.transparentStyle.default,
                        buttonStyles.bigStyle,
                        {
                          borderColor: colors.black,
                          marginTop: values.spacing.md,
                        },
                      ]}>
                      <Text
                        style={[
                          buttonStyles.transparentStyle.text,
                          { color: colors.black },
                        ]}>
                        Create New Account
                      </Text>
                    </TouchableHighlight>
                    <TouchableOpacity style={{ marginTop: values.spacing.lg }}>
                      <Text
                        style={[
                          buttonStyles.smallTextStyle,
                          { color: colors.black, textAlign: 'center' },
                        ]}>
                        Forgot Password
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </Formik>
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
