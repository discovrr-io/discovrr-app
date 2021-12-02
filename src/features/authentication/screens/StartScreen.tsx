import * as React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import { useFocusEffect } from '@react-navigation/native';

import * as constants from 'src/constants';
import { Banner, Button, Spacer, TextInput } from 'src/components';
import { useExtendedTheme } from 'src/hooks';
import { AuthPromptStackScreenProps } from 'src/navigation';

import { LabelledTextInput } from '../components';

const LOGIN_VIDEO_SOURCE = require('../../../../assets/videos/login-video.mp4');
const LOGIN_POSTER_SOURCE = require('../../../../assets/images/login-video-poster.jpg');
const LOGIN_POSTER_ASSET_SOURCE = Image.resolveAssetSource(LOGIN_POSTER_SOURCE);

type AuthPromptStartScreenProps = AuthPromptStackScreenProps<'AuthStart'>;

export default function AuthPromptStartScreen(
  props: AuthPromptStartScreenProps,
) {
  const { colors } = useExtendedTheme();

  const [isVideoPaused, setIsVideoPaused] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setIsVideoPaused(false);
      return () => setIsVideoPaused(true);
    }, []),
  );

  const handleSubmit = async () => {
    props.navigation.navigate('Register');
  };

  return (
    <ScrollView contentContainerStyle={{ flex: 1 }}>
      {/* <FastImage
        source={LOGIN_POSTER_SOURCE}
        style={{
          flexGrow: 1,
          width: '100%',
          backgroundColor: colors.placeholder,
        }}
      /> */}
      <Video
        muted
        repeat
        disableFocus
        playWhenInactive
        paused={isVideoPaused}
        controls={false}
        allowsExternalPlayback={false}
        preventsDisplaySleepDuringVideoPlayback={false}
        resizeMode="cover"
        posterResizeMode="cover"
        source={LOGIN_VIDEO_SOURCE}
        poster={LOGIN_POSTER_ASSET_SOURCE.uri}
        style={{
          flexGrow: 1,
          width: '100%',
          backgroundColor: colors.placeholder,
        }}
      />
      <View style={{ padding: constants.layout.spacing.xl }}>
        <View>
          {props.route.params?.redirected && (
            <Banner
              type="warning"
              title="Please sign in or register to continue"
              containerStyles={{ marginBottom: constants.layout.spacing.lg }}
            />
          )}
          <LabelledTextInput
            label="Enter your email address to sign in or register"
            size="large"
            placeholder="Enter your email address here"
            suffix={
              <TextInput.Icon
                name="arrow-forward"
                size={24}
                color={colors.primary}
                onPress={handleSubmit}
              />
            }
          />
        </View>
        <Spacer.Vertical value="lg" />
        <View style={[styles.divider]}>
          <View style={[styles.dividerLine]} />
          <Text
            allowFontScaling={false}
            style={[constants.font.extraSmallBold, styles.dividerText]}>
            OR
          </Text>
          <View style={[styles.dividerLine]} />
        </View>
        <Spacer.Vertical value="lg" />
        <View>
          {Platform.OS === 'ios' && (
            <Button
              title="Continue with Apple"
              icon="logo-apple"
              variant="outlined"
              onPress={() => {}}
              innerTextProps={{ allowFontScaling: false }}
              containerStyle={[styles.thirdPartyAuthButton]}
            />
          )}
          <Button
            title="Continue with Google"
            icon="logo-google"
            variant="outlined"
            onPress={() => {}}
            innerTextProps={{ allowFontScaling: false }}
            containerStyle={[styles.thirdPartyAuthButton]}
          />
          <Button
            title="Continue with Facebook"
            icon="logo-facebook"
            variant="outlined"
            innerTextProps={{ allowFontScaling: false }}
            onPress={() => {}}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flexGrow: 1,
    flexShrink: 1,
    borderBottomWidth: 1,
    borderColor: constants.color.gray500,
  },
  dividerText: {
    color: constants.color.gray500,
    paddingHorizontal: constants.layout.spacing.sm,
  },
  thirdPartyAuthButton: {
    marginBottom: constants.layout.spacing.md,
  },
});
