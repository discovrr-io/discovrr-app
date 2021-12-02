import * as React from 'react';
import {
  ActivityIndicator,
  // Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import FastImage from 'react-native-fast-image';
// import Video from 'react-native-video';
import { useFocusEffect } from '@react-navigation/native';

import * as constants from 'src/constants';
import { ProfileApi } from 'src/api';
import { useExtendedTheme } from 'src/hooks';
import { AuthPromptStackScreenProps } from 'src/navigation';

import {
  Banner,
  Button,
  LabelledTextInput,
  Spacer,
  TextInput,
} from 'src/components';

// const LOGIN_VIDEO_SOURCE = require('../../../../assets/videos/login-video.mp4');
const LOGIN_POSTER_SOURCE = require('../../../../assets/images/login-video-poster.jpg');
// const LOGIN_POSTER_ASSET_SOURCE = Image.resolveAssetSource(LOGIN_POSTER_SOURCE);

type StartScreenProps = AuthPromptStackScreenProps<'AuthStart'>;

export default function StartScreen(props: StartScreenProps) {
  const { colors } = useExtendedTheme();

  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [_isVideoPaused, setIsVideoPaused] = React.useState(false);

  useFocusEffect(
    React.useCallback(() => {
      setIsVideoPaused(false);
      return () => setIsVideoPaused(true);
    }, []),
  );

  React.useLayoutEffect(() => {
    const unsubscribe = props.navigation.addListener('beforeRemove', event => {
      if (!isLoading) return;
      event.preventDefault();
    });

    return unsubscribe;
  }, [props.navigation, isLoading]);

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    try {
      if (!trimmedEmail) throw undefined; // Go to catch block
      setIsLoading(true);
      const profile = await ProfileApi.fetchProfileByEmail({
        email: trimmedEmail,
      });
      props.navigation.navigate('Login', { profileDetails: profile });
    } catch (_) {
      props.navigation.navigate('Register', { email: trimmedEmail });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior="padding"
          style={{ flexGrow: 1 }}
          keyboardVerticalOffset={Platform.select({ android: -100 })}>
          <FastImage
            source={LOGIN_POSTER_SOURCE}
            style={{
              flexGrow: 1,
              width: '100%',
              backgroundColor: colors.placeholder,
            }}
          />
          {/* <Video
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
          /> */}
          <View style={{ padding: constants.layout.spacing.xl }}>
            <View>
              {props.route.params?.redirected && (
                <Banner
                  type="warning"
                  title="Please sign in or register to continue"
                  containerStyles={{
                    marginBottom: constants.layout.spacing.lg,
                  }}
                />
              )}
              <LabelledTextInput
                size="large"
                editable={!isLoading}
                label="Enter your email address to sign in or register"
                placeholder="Enter your email address here"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                suffix={
                  isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <TextInput.Icon
                      name="arrow-forward"
                      size={24}
                      color={colors.primary}
                      onPress={handleSubmit}
                    />
                  )
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
                  innerTextProps={{ allowFontScaling: false }}
                  containerStyle={[styles.thirdPartyAuthButton]}
                  disabled={isLoading}
                  onPress={() => {}}
                />
              )}
              <Button
                title="Continue with Google"
                icon="logo-google"
                variant="outlined"
                innerTextProps={{ allowFontScaling: false }}
                containerStyle={[styles.thirdPartyAuthButton]}
                disabled={isLoading}
                onPress={() => {}}
              />
              <Button
                title="Continue with Facebook"
                icon="logo-facebook"
                variant="outlined"
                innerTextProps={{ allowFontScaling: false }}
                disabled={isLoading}
                onPress={() => {}}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
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
