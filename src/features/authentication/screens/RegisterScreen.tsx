import * as React from 'react';
import { Image, ScrollView, Switch, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';

import * as constants from 'src/constants';
import { Button, Spacer } from 'src/components';
import { useExtendedTheme } from 'src/hooks';
import { AuthPromptStackScreenProps } from 'src/navigation';

import { LabelledTextInput } from '../components';

const COVER_IMAGE = require('../../../../assets/images/authentication/sculpting.png');
const COVER_IMAGE_ASSET_SOURCE = Image.resolveAssetSource(COVER_IMAGE);

type AuthPromptRegisterScreenProps = AuthPromptStackScreenProps<'Register'>;

export default function AuthPromptRegisterScreen(
  props: AuthPromptRegisterScreenProps,
) {
  const { colors } = useExtendedTheme();

  const handleShowTermsAndConditions = () => {
    props.navigation.push('TermsAndConditions');
  };

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        paddingVertical: constants.layout.spacing.xxl,
      }}>
      <FastImage
        resizeMode="contain"
        source={COVER_IMAGE}
        style={{
          width: '100%',
          aspectRatio:
            COVER_IMAGE_ASSET_SOURCE.width / COVER_IMAGE_ASSET_SOURCE.height,
        }}
      />
      <Spacer.Vertical value="xxl" />
      <View style={{ paddingHorizontal: constants.layout.spacing.xl }}>
        <View>
          <Text
            allowFontScaling={false}
            style={[constants.font.h2, { color: colors.text }]}>
            Register
          </Text>
          <Spacer.Vertical value="xl" />
          <View style={{ flexDirection: 'row' }}>
            <FastImage
              source={constants.media.DEFAULT_AVATAR}
              style={{
                width: 40,
                aspectRatio: 1,
                borderRadius: 20,
                backgroundColor: colors.placeholder,
              }}
            />
            <View style={{ flex: 1, paddingLeft: constants.layout.spacing.lg }}>
              <Text
                maxFontSizeMultiplier={1.2}
                style={[constants.font.largeBold, { color: colors.text }]}>
                Hi there!
              </Text>
              <Text
                maxFontSizeMultiplier={1.2}
                style={[constants.font.small, { color: colors.text }]}>
                Fill in the details below to create a new account with Discovrr.
                It&apos;s that easy!
              </Text>
            </View>
          </View>
        </View>
        <Spacer.Vertical value="lg" />
        <View>
          <LabelledTextInput
            label="Email"
            placeholder="Enter your email"
            size="large"
          />
          <Spacer.Vertical value="lg" />
          <LabelledTextInput
            label="Password"
            placeholder="Type in a secure password"
            size="large"
          />
          <Spacer.Vertical value="lg" />
          <LabelledTextInput
            label="Personal or Business Name"
            placeholder="How should we call you?"
            size="large"
          />
          <Spacer.Vertical value="lg" />
          <LabelledTextInput
            label="Username"
            placeholder="Type in a unique username"
            size="large"
          />
          <Spacer.Vertical value="xl" />
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Switch value={false} />
            <Spacer.Horizontal value="md" />
            <Text
              style={[constants.font.medium, { flex: 1, color: colors.text }]}>
              I&apos;m signing up as a maker
            </Text>
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
      </View>
    </ScrollView>
  );
}
