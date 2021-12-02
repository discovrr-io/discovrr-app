import * as React from 'react';
import { Image, Text } from 'react-native';

import { Button, LabelledTextInput, Spacer } from 'src/components';
import { AuthPromptStackScreenProps } from 'src/navigation';

import AuthFormContainer from './AuthFormContainer';

const COVER_IMAGE = require('../../../../assets/images/authentication/sewing.png');
const COVER_IMAGE_ASSET_SOURCE = Image.resolveAssetSource(COVER_IMAGE);

type ForgotPasswordScreenProps = AuthPromptStackScreenProps<'ForgotPassword'>;

export default function ForgotPasswordScreen(_: ForgotPasswordScreenProps) {
  return (
    <AuthFormContainer
      title="Forgot your password?"
      coverImageSource={COVER_IMAGE_ASSET_SOURCE}
      caption={{
        body: "Don't worry, it happens! Just enter your email address below and we'll send you a reset link.",
      }}>
      <LabelledTextInput
        label="Email"
        placeholder="Enter your email"
        size="large"
      />
      <Spacer.Vertical value="xl" />
      <Button title="Send Me Reset Link" type="primary" variant="contained" />
    </AuthFormContainer>
  );
}
