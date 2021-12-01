import * as React from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import Video from 'react-native-video';
import { createStackNavigator } from '@react-navigation/stack';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import { Button, PlaceholderScreen, Spacer, TextInput } from 'src/components';
import { AuthStackParamList } from 'src/navigation';
import { useExtendedTheme } from 'src/hooks';
import FastImage from 'react-native-fast-image';

const LOGIN_VIDEO_SOURCE = require('../../../assets/videos/login-video.mp4');
const LOGIN_POSTER_SOURCE = require('../../../assets/images/login-video-poster.jpg');
const LOGIN_POSTER_ASSET_SOURCE = Image.resolveAssetSource(LOGIN_POSTER_SOURCE);

const AuthStack = createStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <AuthStack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={PlaceholderScreen} />
      <AuthStack.Screen name="ForgotPassword" component={PlaceholderScreen} />
    </AuthStack.Navigator>
  );
}

function LoginScreen() {
  const { colors } = useExtendedTheme();
  const debug = false;

  return (
    <SafeAreaView
      style={[
        { flex: 1, alignItems: 'center', justifyContent: 'center' },
        debug && { borderWidth: 1, borderColor: 'pink' },
      ]}>
      <FastImage
        source={LOGIN_POSTER_ASSET_SOURCE}
        style={StyleSheet.absoluteFill}
      />
      {/* <Video
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
        style={StyleSheet.absoluteFill}
      /> */}
      <ScrollView
        contentContainerStyle={[
          {
            flexGrow: 1,
            width: '85%',
            alignItems: 'center',
            justifyContent: 'center',
          },
          debug && { borderWidth: 1, borderColor: 'red' },
        ]}>
        <View
          style={[
            [
              {
                padding: constants.layout.spacing.lg,
                borderRadius: constants.layout.radius.lg * 2,
                backgroundColor: colors.card + utilities.percentToHex(0.9),
              },
              debug && { borderWidth: 1, borderColor: 'yellow' },
            ],
          ]}>
          {/* <View
            style={[
              { flex: 1 },
              debug && { borderWidth: 1, borderColor: 'purple' },
            ]}>
            <Text>LOGIN</Text>
            <View>
              <TextInput placeholder="Email" mode="outlined" size="large" />
              <TextInput placeholder="Password" mode="outlined" size="large" />
            </View>
          </View>
          <Spacer.Vertical value="lg" /> */}
          <View style={[debug && { borderWidth: 1, borderColor: 'green' }]}>
            <Button
              title="Continue with Apple"
              icon="logo-apple"
              variant="outlined"
              onPress={() => {}}
            />
            <Spacer.Vertical value="md" />
            <Button
              title="Continue with Google"
              icon="logo-google"
              variant="outlined"
              onPress={() => {}}
            />
            <Spacer.Vertical value="md" />
            <Button
              title="Continue with Facebook"
              icon="logo-facebook"
              variant="outlined"
              onPress={() => {}}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
