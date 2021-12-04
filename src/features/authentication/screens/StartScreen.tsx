import * as React from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

// import FastImage from 'react-native-fast-image';
import Video from 'react-native-video';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import auth from '@react-native-firebase/auth';
import { appleAuth } from '@invertase/react-native-apple-authentication';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import * as constants from 'src/constants';
import * as utilities from 'src/utilities';
import * as authSlice from 'src/features/authentication/auth-slice';
import { ProfileApi } from 'src/api';
import { useAppDispatch, useExtendedTheme, useIsMounted } from 'src/hooks';
import { AuthPromptStackScreenProps } from 'src/navigation';

import {
  Banner,
  Button,
  LabelledTextInput,
  LoadingOverlay,
  Spacer,
  TextInput,
} from 'src/components';

const LOGIN_VIDEO_SOURCE = require('../../../../assets/videos/login-video.mp4');
const LOGIN_POSTER_SOURCE = require('../../../../assets/images/login-video-poster.jpg');
const LOGIN_POSTER_ASSET_SOURCE = Image.resolveAssetSource(LOGIN_POSTER_SOURCE);

type StartScreenProps = AuthPromptStackScreenProps<'AuthStart'>;

export default function StartScreen(props: StartScreenProps) {
  const { colors } = useExtendedTheme();

  const [email, setEmail] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [isVideoPaused, setIsVideoPaused] = React.useState(false);

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
                  containerStyles={{
                    marginBottom: constants.layout.spacing.lg,
                  }}
                />
              )}
              <LabelledTextInput
                size="large"
                editable={!isLoading}
                label="Enter your email address to sign in or register"
                placeholder="Your email address"
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="done"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={handleSubmit}
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
            <StartScreenThirdPartyAuthProviders />
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </SafeAreaView>
  );
}

function StartScreenThirdPartyAuthProviders() {
  const $FUNC = '[StartScreenThirdPartyProviders]';

  const dispatch = useAppDispatch();
  const navigation = useNavigation<StartScreenProps['navigation']>();
  const isMounted = useIsMounted();

  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleSignInWithApple = async () => {
    try {
      console.log($FUNC, 'Authenticating via Apple...');

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleAuthRequestResponse.identityToken) {
        console.error($FUNC, 'Apple identity token is undefined. Aborting...');
        throw new Error(
          'No identity token was found when authenticating with Apple',
        );
      }

      const { identityToken, nonce } = appleAuthRequestResponse;
      const credential = auth.AppleAuthProvider.credential(
        identityToken,
        nonce,
      );

      console.log($FUNC, 'Signing in with Apple credential...');
      setIsProcessing(true);
      await dispatch(authSlice.signInWithCredential({ credential })).unwrap();

      console.log($FUNC, 'Successfully authenticated. Dismissing prompt...');
      navigation.goBack();
    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) return;
      console.error($FUNC, 'Failed to sign in via Apple:', error);
      utilities.alertFirebaseAuthError(error);
    } finally {
      if (isMounted.current) setIsProcessing(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    try {
      console.log($FUNC, 'Authenticating via Google...');

      const { idToken } = await GoogleSignin.signIn();
      const { accessToken } = await GoogleSignin.getTokens();
      const credential = auth.GoogleAuthProvider.credential(
        idToken,
        accessToken,
      );

      console.log($FUNC, 'Signing in with Google credential...');
      setIsProcessing(true);
      await dispatch(authSlice.signInWithCredential({ credential })).unwrap();

      console.log($FUNC, 'Successfully authenticated. Dismissing prompt...');
      navigation.goBack();
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return;
      console.error($FUNC, 'Failed to sign in via Google:', error);
      utilities.alertFirebaseAuthError(error);
    } finally {
      if (isMounted.current) setIsProcessing(false);
    }
  };

  return (
    <View>
      {Platform.OS === 'ios' && (
        <Button
          title="Continue with Apple"
          icon="logo-apple"
          variant="outlined"
          innerTextProps={{ allowFontScaling: false }}
          containerStyle={[styles.thirdPartyAuthButton]}
          disabled={isProcessing}
          onPress={handleSignInWithApple}
        />
      )}
      <Button
        title="Continue with Google"
        icon="logo-google"
        variant="outlined"
        innerTextProps={{ allowFontScaling: false }}
        containerStyle={[styles.thirdPartyAuthButton]}
        disabled={isProcessing}
        onPress={handleSignInWithGoogle}
      />
      <Button
        title="Continue with Facebook"
        icon="logo-facebook"
        variant="outlined"
        innerTextProps={{ allowFontScaling: false }}
        disabled={isProcessing}
        onPress={() =>
          utilities.alertUnavailableFeature({
            message: 'Signing in with Facebook will be available soon!',
          })
        }
      />
      {isProcessing && (
        <LoadingOverlay
          message="Signing you in…"
          caption="This may take a while"
        />
      )}
    </View>
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
