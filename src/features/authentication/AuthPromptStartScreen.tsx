import * as React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import FastImage from 'react-native-fast-image';

import * as constants from 'src/constants';
import { Button, Spacer, TextInput } from 'src/components';
import { useExtendedTheme } from 'src/hooks';
import { AuthPromptStackScreenProps } from 'src/navigation';

import { LabelledTextInput } from './components';

const LOGIN_POSTER_SOURCE = require('../../../assets/images/login-video-poster.jpg');

type AuthPromptStartScreenProps = AuthPromptStackScreenProps<'Start'>;

export default function AuthPromptStartScreen(
  props: AuthPromptStartScreenProps,
) {
  const { colors } = useExtendedTheme();

  const handleSubmit = async () => {
    props.navigation.navigate('Register');
  };

  return (
    <ScrollView contentContainerStyle={{ flex: 1 }}>
      <FastImage
        source={LOGIN_POSTER_SOURCE}
        style={{
          flexGrow: 1,
          width: '100%',
          backgroundColor: colors.placeholder,
        }}
      />
      <View style={{ padding: constants.layout.spacing.xl }}>
        <View>
          <LabelledTextInput
            label="Enter your email address to continue"
            size="large"
            placeholder="Your existing or new email"
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
