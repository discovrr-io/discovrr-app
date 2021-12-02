import * as React from 'react';
import { Image, Switch, Text, View } from 'react-native';

import * as constants from 'src/constants';
import { useExtendedTheme } from 'src/hooks';
import { AuthPromptStackScreenProps } from 'src/navigation';

import {
  Button,
  LabelledPasswordInput,
  LabelledTextInput,
  Spacer,
} from 'src/components';

import AuthFormContainer from './AuthFormContainer';
import Icon from 'react-native-vector-icons/Ionicons';

const COVER_IMAGE = require('../../../../assets/images/authentication/sculpting.png');
const COVER_IMAGE_ASSET_SOURCE = Image.resolveAssetSource(COVER_IMAGE);

type AuthPromptRegisterScreenProps = AuthPromptStackScreenProps<'Register'>;

export default function AuthPromptRegisterScreen(
  props: AuthPromptRegisterScreenProps,
) {
  const { email } = props.route.params ?? {};
  const { colors } = useExtendedTheme();

  const handleShowTermsAndConditions = () => {
    props.navigation.push('TermsAndConditions');
  };

  return (
    <AuthFormContainer
      title="Register"
      coverImageSource={COVER_IMAGE_ASSET_SOURCE}
      caption={{
        title: 'Hi there!',
        body: "Fill in the details below to create a new account with Discovrr. It's that easy!",
        image: constants.media.DEFAULT_AVATAR,
      }}>
      <View>
        <LabelledTextInput
          size="large"
          label="Email"
          placeholder="Enter your email"
          value={email}
        />
        <Spacer.Vertical value="lg" />
        <LabelledPasswordInput
          size="large"
          label="Password"
          placeholder="Type in a secure password"
        />
        <Spacer.Vertical value="lg" />
        <LabelledTextInput
          size="large"
          label="Personal or Business Name"
          placeholder="How should we call you?"
        />
        <Spacer.Vertical value="lg" />
        <LabelledTextInput
          size="large"
          label="Username"
          placeholder="Type in a unique username"
        />
        <Spacer.Vertical value="xl" />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Switch value={false} />
          <Text
            style={[
              constants.font.medium,
              {
                flex: 1,
                color: colors.text,
                paddingHorizontal: constants.layout.spacing.md,
              },
            ]}>
            I&apos;m signing up as a maker
          </Text>
          <Icon
            name="information-circle-outline"
            size={24}
            color={colors.primary}
            onPress={() => {}}
          />
        </View>
      </View>
      <Spacer.Vertical value="xl" />
      <View>
        <Button title="Create Account" type="primary" variant="contained" />
        <Spacer.Vertical value="lg" />
        <Text
          style={[
            constants.font.extraSmall,
            { color: colors.caption, textAlign: 'center' },
          ]}>
          By continuing, you agree to our&nbsp;
          <Text
            onPress={handleShowTermsAndConditions}
            style={[
              { color: colors.primary, textDecorationLine: 'underline' },
            ]}>
            Terms & Conditions
          </Text>
          {'.'}
        </Text>
      </View>
    </AuthFormContainer>
  );
}
