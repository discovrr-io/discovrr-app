import * as React from 'react';
import { Image, View } from 'react-native';

import * as constants from 'src/constants';
import { Button, Spacer } from 'src/components';
import { AuthPromptStackScreenProps } from 'src/navigation';

import AuthFormContainer from './AuthFormContainer';
import { LabelledTextInput } from '../components';

const COVER_IMAGE = require('../../../../assets/images/authentication/painting.png');
const COVER_IMAGE_ASSET_SOURCE = Image.resolveAssetSource(COVER_IMAGE);

type AuthPromptLoginScreenProps = AuthPromptStackScreenProps<'Login'>;

export default function AuthPromptLoginScreen(
  props: AuthPromptLoginScreenProps,
) {
  const { profileDetails } = props.route.params;

  const handlePressForgotPassword = () => {
    props.navigation.navigate('ForgotPassword');
  };

  return (
    <AuthFormContainer
      title="Login"
      coverImageSource={COVER_IMAGE_ASSET_SOURCE}
      caption={{
        title: `Welcome back, ${profileDetails.__publicName}!`,
        body: 'Enter your password below to continue.',
        image: profileDetails.avatar
          ? { uri: profileDetails.avatar.url }
          : constants.media.DEFAULT_AVATAR,
      }}>
      <LabelledTextInput
        secureTextEntry
        size="large"
        label="Password"
        placeholder="Enter your password"
      />
      <Spacer.Vertical value="xl" />
      <View>
        <Button title="Sign In" type="primary" variant="contained" />
        <Spacer.Vertical value="md" />
        <Button
          title="Forgot Password?"
          size="small"
          type="primary"
          onPress={handlePressForgotPassword}
        />
      </View>
    </AuthFormContainer>
  );
}
