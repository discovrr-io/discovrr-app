import React from 'react';
import { useWindowDimensions, Image, StyleSheet, View } from 'react-native';
import Video from 'react-native-video';

import { connect } from 'react-redux';

import { Formik } from 'formik';
import * as yup from 'yup';
import { FormikInput } from '../../components';

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

function LoginScreen({}) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const handleSubmitForm = (values) => {
    console.log(values);
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
      <View style={{ flexGrow: 1, borderColor: 'red', borderWidth: 1 }}>
        <Image
          source={discovrrLogo}
          resizeMode="contain"
          style={[
            loginScreenStyles.discovrrLogo,
            {
              width: screenWidth * 0.65,
              height: screenWidth * 0.65 * 0.271,
              marginTop: screenHeight * 0.05,
            },
          ]}
        />
        <Formik
          validationSchema={formSchema}
          initialValues={{ email: '', password: '' }}
          onSubmit={handleSubmitForm}>
          {(props) => (
            <FormikInput
              formikProps={props}
              field="email"
              placeholder="Email"
              keyboardType="email"
            />
          )}
        </Formik>
      </View>
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
